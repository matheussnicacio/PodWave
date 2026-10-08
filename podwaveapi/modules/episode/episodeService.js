const fs = require('fs');
const path = require('path');
const sequelize = require('../../config/database');
const Episode = require('./episodeModel');
const User = require('../user/userModel');
const Like = require('../like/likeModel');
const Comment = require('../comment/commentModel');
const { PAGINATION } = require('../../config/constants');

const AUDIO_UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'episodes', 'audio');
const COVER_UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'episodes', 'covers');

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

function forbidden() {
  const error = new Error('Você não tem permissão para alterar este episódio.');
  error.status = 403;
  return error;
}

// Remove um arquivo do disco sem nunca lançar: roda DEPOIS de o banco já ter
// sido atualizado, então uma falha aqui deixa, no pior caso, um arquivo
// órfão (lixo) — nunca um registro apontando para um arquivo inexistente.
async function removeFile(dir, filename) {
  if (!filename) return;
  try {
    await fs.promises.unlink(path.join(dir, path.basename(filename)));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Erro ao remover arquivo do disco:', filename, err);
    }
  }
}

// Carrega o episódio e aplica as duas verificações de dono, NESTA ordem:
// 404 (existe?) antes de 403 (é seu?). Se fosse o contrário, o 403 revelaria
// que o id existe e o 404 deixaria de ser a única resposta para "não existe".
async function findOwnedEpisode(episodeId, userId) {
  if (!/^\d+$/.test(String(episodeId))) {
    throw notFound();
  }

  const episode = await Episode.findByPk(episodeId);
  if (!episode) {
    throw notFound();
  }
  if (episode.userId !== userId) {
    throw forbidden();
  }
  return episode;
}

async function createEpisode(userId, { title, description, audioFilename, coverFilename }) {
  // Escrita dupla (episódio + contador do usuário) em UMA transação: ou as
  // duas acontecem ou nenhuma. increment() gera um UPDATE atômico no banco
  // (episodes_count = episodes_count + 1), sem ler-somar-salvar em memória.
  // Todo comando leva { transaction: t }.
  const newEpisode = await sequelize.transaction(async (t) => {
    const created = await Episode.create({
      title,
      description: description || null,
      audio: audioFilename,
      cover: coverFilename,
      userId
    }, { transaction: t });

    await User.increment('episodesCount', { by: 1, where: { id: userId }, transaction: t });
    return created;
  });

  return {
    id: newEpisode.id,
    title: newEpisode.title,
    description: newEpisode.description,
    audio: newEpisode.audio,
    cover: newEpisode.cover,
    views: newEpisode.views,
    likesCount: newEpisode.likesCount,
    commentsCount: newEpisode.commentsCount,
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

  // isLiked: visitante (viewerId undefined) é sempre false; logado consulta
  // a tabela de curtidas. likesCount/commentsCount já vêm em toJSON(), pois
  // são colunas do próprio episódio.
  let isLiked = false;
  if (viewerId !== undefined) {
    const like = await Like.findOne({
      where: { userId: viewerId, episodeId: episode.id },
      attributes: ['id']
    });
    isLiked = like !== null;
  }

  return {
    ...episode.toJSON(),
    // true só se quem pediu está logado E é o autor do episódio.
    isOwner: viewerId !== undefined && viewerId === episode.userId,
    isLiked
  };
}

/**
 * Episódios do usuário logado, do mais novo para o mais antigo.
 */
async function getMyEpisodes(userId) {
  return Episode.findAll({
    where: { userId },
    order: [['createdAt', 'DESC'], ['id', 'DESC']]
  });
}

/**
 * Dados para pré-preencher o formulário de edição. Só o dono. Não incrementa
 * views: abrir a tela de edição não é "ouvir" o episódio.
 */
async function getEpisodeForEdit(episodeId, userId) {
  const episode = await findOwnedEpisode(episodeId, userId);
  return {
    id: episode.id,
    title: episode.title,
    description: episode.description,
    cover: episode.cover
  };
}

/**
 * Edita título/descrição e, opcionalmente, troca a capa.
 * Ordem: valida dono -> atualiza o BANCO -> só então apaga a capa antiga do
 * disco. Se o disco fosse apagado primeiro e o save falhasse, o registro
 * continuaria apontando para um arquivo que não existe mais.
 */
async function updateEpisode(episodeId, userId, { title, description, newCoverFilename }) {
  const episode = await findOwnedEpisode(episodeId, userId);

  const oldCover = episode.cover;

  episode.title = title;
  episode.description = description || null;
  if (newCoverFilename) {
    episode.cover = newCoverFilename;
  }
  await episode.save();

  if (newCoverFilename && oldCover && oldCover !== newCoverFilename) {
    await removeFile(COVER_UPLOADS_DIR, oldCover);
  }

  return {
    id: episode.id,
    title: episode.title,
    description: episode.description,
    audio: episode.audio,
    cover: episode.cover,
    views: episode.views,
    likesCount: episode.likesCount,
    commentsCount: episode.commentsCount,
    userId: episode.userId,
    updatedAt: episode.updatedAt
  };
}

/**
 * Exclui o episódio: curtidas, comentários, registro e contador do usuário —
 * tudo numa ÚNICA transação — e depois os DOIS arquivos do disco.
 *
 * Por que limpar likes/comments explicitamente: sem isso, as linhas ficariam
 * "penduradas" apontando para um episódio que não existe mais (ou o banco
 * recusaria o DELETE por causa da FK). Banco primeiro, disco depois: se a
 * transação falhar, nada foi apagado e os arquivos continuam intactos.
 */
async function deleteEpisode(episodeId, userId) {
  const episode = await findOwnedEpisode(episodeId, userId);

  const { audio, cover } = episode;

  await sequelize.transaction(async (t) => {
    await Like.destroy({ where: { episodeId: episode.id }, transaction: t });
    await Comment.destroy({ where: { episodeId: episode.id }, transaction: t });
    await episode.destroy({ transaction: t });
    await User.decrement('episodesCount', { by: 1, where: { id: userId }, transaction: t });
  });

  await removeFile(AUDIO_UPLOADS_DIR, audio);
  await removeFile(COVER_UPLOADS_DIR, cover);
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
  getMyEpisodes,
  getEpisodeForEdit,
  updateEpisode,
  deleteEpisode,
  parsePagination,
  getEpisodeAudioFile
};
