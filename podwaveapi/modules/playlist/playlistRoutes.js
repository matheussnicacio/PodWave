const express = require('express');
const router = express.Router();
const playlistController = require('./playlistController');
const { createPlaylistValidator } = require('./playlistValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');
const optionalAuth = require('../../middlewares/optionalAuth');

// Só a LEITURA de uma playlist é pública (optionalAuth): visitante vê as
// públicas; a dona vê também as privadas (o service decide pelo isPublic).
// Todo o resto exige login.
router.get('/my-playlists', isAuthenticated, asyncHandler(playlistController.getMyPlaylists));
router.post('/playlists', isAuthenticated, createPlaylistValidator, asyncHandler(playlistController.createPlaylist));
router.get('/playlists/:id', optionalAuth, asyncHandler(playlistController.getPlaylistDetails));
router.delete('/playlists/:id', isAuthenticated, asyncHandler(playlistController.deletePlaylist));
router.post('/playlists/:id/episodes', isAuthenticated, asyncHandler(playlistController.addEpisode));
router.delete('/playlists/:id/episodes/:episodeId', isAuthenticated, asyncHandler(playlistController.removeEpisode));
router.get('/episodes/:episodeId/playlists-status', isAuthenticated, asyncHandler(playlistController.getPlaylistsStatus));

module.exports = router;
