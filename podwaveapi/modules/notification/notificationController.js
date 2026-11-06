const notificationService = require('./notificationService');
const { parsePagination } = require('../../utils/pagination');
const { parseId } = require('../../utils/parseId');
const { success } = require('../../middlewares/apiResponse');

// O destinatário é SEMPRE quem está no token (req.user.id): ninguém lê nem
// marca os avisos de outra pessoa passando um id na URL.

// GET /api/notifications?page=&limit=
exports.getNotifications = async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const notifications = await notificationService.getUserNotifications(req.user.id, page, limit);
  return success(res, notifications);
};

// GET /api/notifications/unread-count -> { unreadCount } (um objeto, não um
// número solto: dá para acrescentar campos depois sem quebrar o front).
exports.getUnreadCount = async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user.id);
  return success(res, { unreadCount });
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  const notificationId = parseId(req.params.id, 'notificação');
  const result = await notificationService.markAsRead(notificationId, req.user.id);
  return success(res, result, 'Notificação marcada como lida.');
};
