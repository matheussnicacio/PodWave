const Notification = require('./notificationModel');
const User = require('../user/userModel');
const Episode = require('../episode/episodeModel');
const { PAGINATION } = require('../../config/constants');

// Só colunas PÚBLICAS de quem agiu (nunca password, email, isAdmin...).
const PUBLIC_USER_ATTRIBUTES = ['id', 'username', 'fullName', 'profilePicture'];

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/**
 * Cria um aviso para `userId` (quem recebe) sobre a ação de `actorId`.
 *
 * Chamada DENTRO da transação de curtir/comentar/seguir, por isso recebe a
 * transação como 2º argumento e a repassa ao create. Se a transação não for
 * repassada, o create roda em OUTRA conexão, fora dela: como a transação já
 * travou as linhas (lock do episódio/usuário), o create fica esperando um
 * lock que só será solto quando a transação terminar — e ela está esperando
 * o create. Uns 50 s depois: 500 "Lock wait timeout exceeded".
 *
 * Ninguém é avisado das próprias ações: curtir o próprio episódio não gera aviso.
 */
async function createNotification({ userId, actorId, type, episodeId = null }, transaction) {
  if (userId === actorId) {
    return null;
  }
  return Notification.create({ userId, actorId, type, episodeId }, { transaction });
}

/**
 * Apaga o aviso quando a ação é DESFEITA (descurtir, deixar de seguir): um
 * aviso de algo que não existe mais seria mentira. Os quatro dados no where —
 * e episodeId com padrão null, que vira `episode_id IS NULL` (o aviso de seguir).
 */
async function removeNotification({ userId, actorId, type, episodeId = null }, transaction) {
  return Notification.destroy({ where: { userId, actorId, type, episodeId }, transaction });
}

/**
 * Uma página dos avisos de `userId`, do mais novo para o mais antigo, com
 * quem agiu e o episódio (só id, título e capa).
 */
async function getUserNotifications(userId, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) {
  return Notification.findAll({
    where: { userId },
    include: [
      { model: User, as: 'Actor', attributes: PUBLIC_USER_ATTRIBUTES },
      { model: Episode, as: 'episode', attributes: ['id', 'title', 'cover'] }
    ],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });
}

/**
 * Quantas não lidas. Rota própria (e não a lista): o sino pergunta isso a
 * cada 30 s para cada pessoa logada — um COUNT coberto pelo índice
 * (user_id, is_read), sem trazer linhas, joins nem fotos.
 */
async function getUnreadCount(userId) {
  return Notification.count({ where: { userId, isRead: false } });
}

/**
 * Marca como lida. 404 (não existe) -> 403 (não é sua), a ordem de sempre.
 * IDEMPOTENTE: se já estava lida, não escreve de novo e responde igual.
 * unreadCount é calculado DEPOIS da escrita terminar (await no save antes do
 * count): contar antes devolveria o número velho.
 *
 * @returns {{ id, isRead: true, unreadCount }}
 */
async function markAsRead(notificationId, userId) {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    throw httpError('Notificação não encontrada.', 404);
  }
  if (notification.userId !== userId) {
    throw httpError('Você não tem permissão para alterar esta notificação.', 403);
  }

  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }

  const unreadCount = await getUnreadCount(userId);
  return { id: notification.id, isRead: true, unreadCount };
}

module.exports = {
  createNotification,
  removeNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead
};
