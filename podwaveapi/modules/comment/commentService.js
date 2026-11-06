const sequelize = require('../../config/database');
const Comment = require('./commentModel');
const Episode = require('../episode/episodeModel');
const User = require('../user/userModel');
const { createNotification } = require('../notification/notificationService');
const { NOTIFICATION } = require('../../config/constants');

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

function assertValidId(episodeId) {
  if (!/^\d+$/.test(String(episodeId))) {
    throw notFound();
  }
}

/**
 * Cria um comentário, sobe o contador do episódio e avisa o dono do episódio,
 * em UMA transação (três escritas). Só CRIA o aviso: a API não tem rota para
 * excluir comentários, então não existe um "desfazer" que precise apagá-lo.
 * Todo comando recebe { transaction: t } (ver comentário em likeService).
 *
 * Ordem dos parâmetros: (userId, episodeId, content) — a mesma do controller.
 * userId e episodeId são ambos números: trocá-los não gera erro, só grava o
 * comentário no lugar errado.
 *
 * Devolve o comentário JÁ com o autor: o front precisa do nome/foto para
 * mostrar o comentário novo no topo sem recarregar a lista.
 */
async function createComment(userId, episodeId, content) {
  assertValidId(episodeId);

  return sequelize.transaction(async (t) => {
    const episode = await Episode.findByPk(episodeId, { attributes: ['id', 'userId'], transaction: t });
    if (!episode) {
      throw notFound();
    }

    const comment = await Comment.create({ userId, episodeId, content }, { transaction: t });
    await Episode.increment('commentsCount', { by: 1, where: { id: episodeId }, transaction: t });
    await createNotification({
      userId: episode.userId,
      actorId: userId,
      type: NOTIFICATION.TYPES.COMMENT,
      episodeId: episode.id
    }, t);

    return Comment.findByPk(comment.id, { include: [AUTHOR_INCLUDE], transaction: t });
  });
}

/**
 * Comentários de um episódio, mais novos primeiro (id desempata createdAt
 * igual, para a ordem ser estável).
 */
async function getComments(episodeId) {
  assertValidId(episodeId);

  const episode = await Episode.findByPk(episodeId, { attributes: ['id'] });
  if (!episode) {
    throw notFound();
  }

  return Comment.findAll({
    where: { episodeId },
    include: [AUTHOR_INCLUDE],
    order: [['createdAt', 'DESC'], ['id', 'DESC']]
  });
}

module.exports = { createComment, getComments };
