const express = require('express');
const router = express.Router();
const likeController = require('./likeController');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');
const optionalAuth = require('../../middlewares/optionalAuth');

// Curtir/descurtir exige login (sem token -> 401).
router.post('/episodes/:episodeId/toggle-like', isAuthenticated, asyncHandler(likeController.toggleLike));

// Pública com optionalAuth: visitante recebe liked: false, sem 401.
router.get('/episodes/:episodeId/like-status', optionalAuth, asyncHandler(likeController.getLikeStatus));

// Itens curtidos pelo usuário logado.
router.get('/liked-episodes', isAuthenticated, asyncHandler(likeController.getLikedEpisodes));

module.exports = router;
