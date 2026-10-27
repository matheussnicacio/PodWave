const followService = require('./followService');
const episodeService = require('../episode/episodeService');
const { success } = require('../../middlewares/apiResponse');

// Converte req.params.userId (SEMPRE string) em número e recusa o que não for
// um inteiro positivo com 400.
//
// Por que aqui, na borda: req.user.id vem do JWT como NÚMERO e
// req.params.userId vem da URL como STRING. Com `followerId === followingId`
// o Node compara tipo e valor: `5 === "5"` é false. Sem a conversão, a checagem
// "não pode seguir a si mesmo" NUNCA dispara e a pessoa se segue sem erro
// nenhum. Convertendo uma vez, na entrada, todo o resto do código (service,
// banco) trabalha só com número.
function parseUserId(raw) {
  const text = String(raw);
  const id = Number(text);

  if (!/^\d+$/.test(text) || !Number.isSafeInteger(id) || id < 1) {
    const error = new Error('Identificador de usuário inválido.');
    error.status = 400;
    throw error;
  }
  return id;
}

// POST /api/users/:userId/toggle-follow
// 201 quando passou a seguir; 200 quando deixou de seguir.
exports.toggleFollow = async (req, res) => {
  const followingId = parseUserId(req.params.userId);
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
  const targetId = parseUserId(req.params.userId);
  const isFollowing = await followService.getFollowStatus(req.user.id, targetId);
  return success(res, { isFollowing });
};

// GET /api/users/:userId/followers (pública)
exports.getFollowers = async (req, res) => {
  const users = await followService.getFollowers(parseUserId(req.params.userId));
  return success(res, users);
};

// GET /api/users/:userId/following (pública)
exports.getFollowing = async (req, res) => {
  const users = await followService.getFollowing(parseUserId(req.params.userId));
  return success(res, users);
};

// GET /api/following-episodes?page=&limit= — feed de quem EU sigo.
exports.getFollowingEpisodes = async (req, res) => {
  const { page, limit } = episodeService.parsePagination(req.query);
  const items = await episodeService.getFollowingEpisodes(req.user.id, page, limit);
  return success(res, items);
};
