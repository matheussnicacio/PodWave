const express = require('express');
const router = express.Router();
const followController = require('./followController');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');

// Seguir e consultar "eu sigo?" exigem login (sem token -> 401).
router.post('/users/:userId/toggle-follow', isAuthenticated, asyncHandler(followController.toggleFollow));
router.get('/users/:userId/follow-status', isAuthenticated, asyncHandler(followController.getFollowStatus));

// As listas são PÚBLICAS, como o perfil público: não exigem token.
router.get('/users/:userId/followers', asyncHandler(followController.getFollowers));
router.get('/users/:userId/following', asyncHandler(followController.getFollowing));

// Feed filtrado: só episódios de quem o usuário logado segue.
router.get('/following-episodes', isAuthenticated, asyncHandler(followController.getFollowingEpisodes));

module.exports = router;
