const express = require('express');
const router = express.Router();
const notificationController = require('./notificationController');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');

// As três exigem login: aviso é sempre de alguém.
router.get('/notifications', isAuthenticated, asyncHandler(notificationController.getNotifications));
router.get('/notifications/unread-count', isAuthenticated, asyncHandler(notificationController.getUnreadCount));
router.patch('/notifications/:id/read', isAuthenticated, asyncHandler(notificationController.markAsRead));

module.exports = router;
