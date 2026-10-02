const fs = require('fs');
const path = require('path');
const Episode = require('./episodeModel');
const User = require('../user/userModel');
const { PAGINATION } = require('../../config/constants');

const AUDIO_UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'episodes', 'audio');

// Include reaproveitado pelo detalhe e pelo feed: traz o autor junto do
// episódio ("popula"), mas SÓ com as colunas públicas — password (e email)
// nunca entram na lista de attributes, então nunca saem do banco.
const AUTHOR_INCLUDE = {
  model: User,
  as: 'author',
  attributes: ['id', 'username', 'fullName', 'profilePicture']
};

function notFound() {
  const error = new Error('Episódio não encontrado.');
  error.status = 404;
  return error;
}

async function createEpisode(userId, { title, description, audioFilename, coverFilename }) {
  const newEpisode = await Episode.create({
    title,
    description: description || null,
    audio: audioFilename,
    cover: coverFilename,
    userId
  });

  // Contador do usuário (Aula 03) incrementado a cada episódio publicado
  // com sucesso. increment() gera um UPDATE atômico direto no banco
  // (episodes_count = episodes_count + 1), em vez de ler o valor, somar em
  // memória e salvar de volta — evita perder incrementos concorrentes se
  // o mesmo usuário publicar dois episódios em paralelo.
  await User.increment('episodesCount', { by: 1, where: { id: userId } });

  return {
    id: newEpisode.id,
    title: newEpisode.title,
    description: newEpisode.description,
    audio: newEpisode.audio,
    cover: newEpisode.cover,
    views: newEpisode.views,
    userId: newEpisode.userId,
    createdAt: newEpisode.createdAt
  };
}

/**
 * Detalhe de um episódio, com o autor populado e a contagem de views
 * incrementada. `viewerId` vem de req.user?.id (optionalAuth): undefined para
 * visitante, o id do usuário para logado.
 */
async function getEpisodeDetails(episodeId, viewerId) {
  // Número inválido ("abc", "1.5", "-3") nunca vai existir: 404 direto, sem
  // nem consultar o banco.
  if (!/^\d+$/.test(String(episodeId))) {
    throw notFound();
  }

  const episode = await Episode.findByPk(episodeId, { include: [AUTHOR_INCLUDE] });
  if (!episode) {
    throw notFound();
  }

  // UPDATE atômico (views = views + 1), pelo mesmo motivo do episodesCount:
  // dois ouvintes abrindo o mesmo episódio ao mesmo tempo não perdem contagem.
  await episode.increment('views', { by: 1 });
  // increment() atualiza o valor no banco; reload() traz o número atualizado
  // (e mantém o include do autor).
  await episode.reload();

  return {
    ...episode.toJSON(),
    // true só se quem pediu está logado E é o autor do episódio.
    isOwner: viewerId !== undefined && viewerId === episode.userId
  };
}

/**
 * Uma página do feed geral, do mais recente para o mais antigo.
 * offset = (page - 1) * limit: o cliente pede "página N" (1, 2, 3...); o
 * banco só entende "pule X registros". Página 1 pula 0, página 2 pula
 * `limit`, página 3 pula 2*limit, e assim por diante.
 */
async function getFeedEpisodes({ page, limit }) {
  const offset = (page - 1) * limit;

  return Episode.findAll({
    include: [AUTHOR_INCLUDE],
    // id como critério de desempate: sem ele, episódios com o mesmo
    // createdAt poderiam aparecer em páginas diferentes em ordens trocadas
    // (repetir ou pular item entre uma página e outra).
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit,
    offset
  });
}

/**
 * Normaliza ?page= e ?limit=: valores ausentes, não numéricos, zero ou
 * negativos caem no padrão; limit é limitado a PAGINATION.LIMIT_MAX.
 */
function parsePagination(query) {
  const page = parseInt(query.page, 10);
  const limit = parseInt(query.limit, 10);

  return {
    page: Number.isInteger(page) && page >= 1 ? page : PAGINATION.DEFAULT_PAGE,
    limit: Number.isInteger(limit) && limit >= 1
      ? Math.min(limit, PAGINATION.LIMIT_MAX)
      : PAGINATION.DEFAULT_LIMIT
  };
}

/**
 * Prepara o /stream: valida o episódio e o arquivo em disco e devolve o
 * caminho absoluto + tamanho em bytes. Quem responde (headers, Range, pipe)
 * é o controller.
 */
async function getEpisodeAudioFile(episodeId) {
  if (!/^\d+$/.test(String(episodeId))) {
    throw notFound();
  }

  const episode = await Episode.findByPk(episodeId, { attributes: ['id', 'audio'] });
  if (!episode) {
    throw notFound();
  }

  const filePath = path.join(AUDIO_UPLOADS_DIR, path.basename(episode.audio));

  let stats;
  try {
    stats = await fs.promises.stat(filePath);
  } catch (err) {
    const error = new Error('Arquivo de áudio não encontrado.');
    error.status = 404;
    throw error;
  }

  return { filePath, size: stats.size };
}

module.exports = {
  createEpisode,
  getEpisodeDetails,
  getFeedEpisodes,
  parsePagination,
  getEpisodeAudioFile
};
