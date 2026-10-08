const express = require('express');
const router = express.Router();
const commentController = require('./commentController');
const { commentValidator } = require('./commentValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');

// Comentar: autenticado (401) -> validado (400) -> service (404 se o episódio
// não existe).
router.post(
  '/episodes/:episodeId/comments',
  isAuthenticated,
  commentValidator,
  asyncHandler(commentController.createComment)
);

// Listar é público: visitante também lê os comentários.
router.get('/episodes/:episodeId/comments', asyncHandler(commentController.getComments));

module.exports = router;
