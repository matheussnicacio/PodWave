const likeService = require('./likeService');
const { success } = require('../../middlewares/apiResponse');

// POST /api/episodes/:episodeId/toggle-like
// 201 quando a curtida foi CRIADA; 200 quando foi REMOVIDA.
exports.toggleLike = async (req, res) => {
  const result = await likeService.toggleLike(req.user.id, req.params.episodeId);
  return success(
    res,
    result,
    result.liked ? 'Episódio curtido.' : 'Curtida removida.',
    result.liked ? 201 : 200
  );
};

// GET /api/episodes/:episodeId/like-status (optionalAuth)
exports.getLikeStatus = async (req, res) => {
  const result = await likeService.getLikeStatus(req.user?.id, req.params.episodeId);
  return success(res, result);
};

// GET /api/liked-episodes
exports.getLikedEpisodes = async (req, res) => {
  const episodes = await likeService.getLikedEpisodes(req.user.id);
  return success(res, episodes);
};
