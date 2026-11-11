const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('../user/userModel');
const Episode = require('../episode/episodeModel');
const Comment = require('../comment/commentModel');
const Like = require('../like/likeModel');
const Report = require('../report/reportModel');
const { REPORT } = require('../../config/constants');
const { escapeLike } = require('../../utils/escapeLike');

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Só colunas PÚBLICAS de usuário nos includes (quem denunciou, autor do
// episódio). E-mail e as flags aparecem apenas na lista de usuários do painel.
const PUBLIC_USER_ATTRIBUTES = ['id', 'username', 'fullName', 'profilePicture'];
const EPISODE_ATTRIBUTES = ['id', 'title', 'cover', 'userId', 'createdAt'];

// Colunas da lista de usuários do painel: attributes EXPLÍCITO, para que a
// coluna password nunca saia do banco (um "todas menos password" quebraria
// no dia em que alguém acrescentasse uma coluna sensível nova).
const ADMIN_USER_ATTRIBUTES = [
  'id', 'username', 'email', 'fullName', 'profilePicture',
  'isAdmin', 'isBlocked', 'followersCount', 'followingCount', 'episodesCount', 'createdAt'
];

/**
 * Os números do Dashboard: sete contagens EM PARALELO (são independentes;
 * o tempo total é o da mais lenta, não a soma).
 * As chaves são fixas: users, blockedUsers, episodes, comments, likes,
 * pendingReports, reviewedReports.
 */
async function getDashboardStats() {
  const [users, blockedUsers, episodes, comments, likes, pendingReports, reviewedReports] = await Promise.all([
    User.count(),
    User.count({ where: { isBlocked: true } }),
    Episode.count(),
    Comment.count(),
    Like.count(),
    Report.count({ where: { status: REPORT.STATUS.PENDING } }),
    Report.count({ where: { status: REPORT.STATUS.REVIEWED } })
  ]);

  return { users, blockedUsers, episodes, comments, likes, pendingReports, reviewedReports };
}

/**
 * Uma página de denúncias, a mais nova primeiro (id desempata).
 * status 'all' -> sem filtro; 'pending' | 'reviewed' -> WHERE status = ?.
 * Vem junto: quem denunciou (Reporter), o episódio e, dentro dele, o autor —
 * tudo só com colunas públicas.
 */
async function getReports(status, page, limit) {
  const where = status === 'all' ? {} : { status };

  return Report.findAll({
    where,
    attributes: ['id', 'reason', 'status', 'reviewedAt', 'createdAt', 'episodeId'],
    include: [
      { model: User, as: 'Reporter', attributes: PUBLIC_USER_ATTRIBUTES },
      {
        model: Episode,
        as: 'episode',
        attributes: EPISODE_ATTRIBUTES,
        include: [{ model: User, as: 'author', attributes: PUBLIC_USER_ATTRIBUTES }]
      }
    ],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });
}

/**
 * Marca a denúncia como revisada. IDEMPOTENTE: revisar de novo responde 200
 * com a MESMA data, porque só escreve se ainda estava pendente. Um segundo
 * clique (ou dois administradores ao mesmo tempo) não muda o reviewedAt.
 *
 * Por que o reload(): depois do update, o objeto em memória guarda o
 * new Date() do JavaScript, com milissegundos. A coluna DATETIME do MySQL
 * guarda só os segundos. Sem o reload, a primeira resposta mostraria
 * ...:15.734Z e a segunda (lida do banco) ...:15.000Z — a "mesma" revisão
 * com duas datas. O reload lê de volta o que o banco gravou de fato.
 */
async function reviewReport(id) {
  const report = await Report.findByPk(id);
  if (!report) {
    throw httpError('Denúncia não encontrada.', 404);
  }

  if (report.status !== REPORT.STATUS.REVIEWED) {
    await report.update({ status: REPORT.STATUS.REVIEWED, reviewedAt: new Date() });
    await report.reload();
  }

  return { id: report.id, status: report.status, reviewedAt: report.reviewedAt };
}

/**
 * Uma página de usuários, com busca por username, e-mail OU nome completo
 * (LIKE com os curingas escapados). Texto vazio = sem filtro.
 */
async function getUsers(search, page, limit) {
  const where = {};
  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    where[Op.or] = [
      { username: { [Op.like]: pattern } },
      { email: { [Op.like]: pattern } },
      { fullName: { [Op.like]: pattern } }
    ];
  }

  return User.findAll({
    where,
    attributes: ADMIN_USER_ATTRIBUTES,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });
}

/**
 * Bloqueia/desbloqueia. Ordem das recusas:
 *  404 (existe?) -> 400 (é você mesmo? ninguém se tranca para fora) ->
 *  403 (é outro administrador? um admin não bloqueia outro; rebaixar é com
 *  o script) -> grava SÓ se mudar (bloquear quem já está bloqueado = 200,
 *  sem escrita: idempotente, como a revisão).
 */
async function setUserBlocked(targetId, isBlocked, adminId) {
  const user = await User.findByPk(targetId, { attributes: ['id', 'username', 'isAdmin', 'isBlocked'] });
  if (!user) {
    throw httpError('Usuário não encontrado.', 404);
  }
  if (user.id === adminId) {
    throw httpError('Você não pode bloquear a sua própria conta.', 400);
  }
  if (user.isAdmin) {
    throw httpError('Não é possível bloquear outro administrador.', 403);
  }

  if (user.isBlocked !== isBlocked) {
    user.isBlocked = isBlocked;
    await user.save();
  }

  return { id: user.id, username: user.username, isBlocked: user.isBlocked };
}

/**
 * Uma página de episódios (busca no título), com o autor e, em cada um, o
 * número de denúncias PENDENTES (pendingReportsCount).
 *
 * Duas consultas em vez de um include agrupado: um include de Report com
 * GROUP BY junto do limit/offset faz o Sequelize montar uma subconsulta
 * complicada (e o limit passaria a contar linhas da junção, não episódios).
 * Aqui: 1) a página de episódios, normal; 2) UMA consulta agrupada, só com
 * os ids DESTA página (Op.in), contando as pendentes por episódio
 * (GROUP BY episode_id, raw: true). Um Map junta as duas. Episódio sem
 * denúncia não aparece no resultado agrupado -> 0.
 */
async function getEpisodes(search, page, limit) {
  const where = search ? { title: { [Op.like]: `%${escapeLike(search)}%` } } : {};

  const episodes = await Episode.findAll({
    where,
    attributes: ['id', 'title', 'cover', 'views', 'likesCount', 'commentsCount', 'createdAt', 'userId'],
    include: [{ model: User, as: 'author', attributes: PUBLIC_USER_ATTRIBUTES }],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });

  if (episodes.length === 0) return [];

  const ids = episodes.map((episode) => episode.id);
  const rows = await Report.findAll({
    attributes: ['episodeId', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
    where: { episodeId: { [Op.in]: ids }, status: REPORT.STATUS.PENDING },
    group: ['episodeId'],
    raw: true
  });

  // COUNT(*) chega como texto em alguns drivers ("2"): Number() garante número.
  const pendingByEpisode = new Map(rows.map((row) => [row.episodeId, Number(row.total)]));

  return episodes.map((episode) => ({
    ...episode.toJSON(),
    pendingReportsCount: pendingByEpisode.get(episode.id) || 0
  }));
}

module.exports = { getDashboardStats, getReports, reviewReport, getUsers, setUserBlocked, getEpisodes };
