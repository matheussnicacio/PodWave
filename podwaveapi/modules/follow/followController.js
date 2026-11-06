const followService = require('./followService');
const episodeService = require('../episode/episodeService');
const { parsePagination } = require('../../utils/pagination');
const { parseId } = require('../../utils/parseId');
const { success } = require('../../middlewares/apiResponse');

// Ids da URL são convertidos por utils/parseId (Aula 13): a mesma regra e a
// mesma mensagem ("Identificador de usuário inválido.") que a antiga função
// local parseUserId, agora compartilhada com o módulo de playlists.
//
// Por que converter aqui, na borda: req.user.id vem do JWT como NÚMERO e
// req.params.userId vem da URL como STRING; `5 === "5"` é false, e a checagem
// "não pode seguir a si mesmo" nunca dispararia sem a conversão.

// POST /api/users/:userId/toggle-follow
// 201 quando passou a seguir; 200 quando deixou de seguir.
exports.toggleFollow = async (req, res) => {
  const followingId = parseId(req.params.userId, 'usuário');
  const result = await followService.toggleFollow(req.user.id, followingId);
  return success(
    res,
    result,
    result.isFollowing ? 'Você começou a seguir.' : 'Você deixou de seguir.',
    result.isFollowing ? 201 : 200
  );
};

// GET /api/users/:userId/follow-status
exports.getFollowStatus = async (req, res) => {
  const targetId = parseId(req.params.userId, 'usuário');
  const isFollowing = await followService.getFollowStatus(req.user.id, targetId);
  return success(res, { isFollowing });
};

// GET /api/users/:userId/followers (pública)
exports.getFollowers = async (req, res) => {
  const users = await followService.getFollowers(parseId(req.params.userId, 'usuário'));
  return success(res, users);
};

// GET /api/users/:userId/following (pública)
exports.getFollowing = async (req, res) => {
  const users = await followService.getFollowing(parseId(req.params.userId, 'usuário'));
  return success(res, users);
};

// GET /api/following-episodes?page=&limit= — feed de quem EU sigo.
exports.getFollowingEpisodes = async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const items = await episodeService.getFollowingEpisodes(req.user.id, page, limit);
  return success(res, items);
};
