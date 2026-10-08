const commentService = require('./commentService');
const { success } = require('../../middlewares/apiResponse');

// POST /api/episodes/:episodeId/comments
exports.createComment = async (req, res) => {
  const { content } = req.body;
  // Mesma ordem do service: (userId, episodeId, content).
  const comment = await commentService.createComment(req.user.id, req.params.episodeId, content);
  return success(res, comment, 'Comentário publicado.', 201);
};

// GET /api/episodes/:episodeId/comments (público)
exports.getComments = async (req, res) => {
  const comments = await commentService.getComments(req.params.episodeId);
  return success(res, comments);
};
