const playlistService = require('./playlistService');
const { parseId } = require('../../utils/parseId');
const { success } = require('../../middlewares/apiResponse');

// Todo id que vem de fora (req.params e req.body) passa pelo parseId: lixo
// vira 400 ANTES de qualquer consulta. Ordem nas rotas de escrita:
// 400 (entrada inválida) -> 404 (não existe) -> 403 (não é seu).

// GET /api/my-playlists
exports.getMyPlaylists = async (req, res) => {
  const playlists = await playlistService.getUserPlaylists(req.user.id);
  return success(res, playlists);
};

// POST /api/playlists
exports.createPlaylist = async (req, res) => {
  const { title, description, isPublic } = req.body;
  const playlist = await playlistService.createPlaylist(req.user.id, { title, description, isPublic });
  return success(res, playlist, 'Playlist criada.', 201);
};

// GET /api/playlists/:id (pública, com optionalAuth)
exports.getPlaylistDetails = async (req, res) => {
  const playlistId = parseId(req.params.id, 'playlist');
  const { playlist, episodes, isOwner } = await playlistService.getPlaylistById(
    playlistId,
    req.user?.id ?? null
  );
  return success(res, { ...playlist.toJSON(), episodes, isOwner });
};

// DELETE /api/playlists/:id
exports.deletePlaylist = async (req, res) => {
  const playlistId = parseId(req.params.id, 'playlist');
  await playlistService.deletePlaylist(req.user.id, playlistId);
  return success(res, null, 'Playlist excluída.');
};

// POST /api/playlists/:id/episodes   corpo: { "episodeId": 5 }
// 201 quando entrou agora; 200 quando já estava (idempotente).
exports.addEpisode = async (req, res) => {
  const playlistId = parseId(req.params.id, 'playlist');
  const episodeId = parseId(req.body?.episodeId, 'episódio');
  const result = await playlistService.addToPlaylist(req.user.id, playlistId, episodeId);
  return success(
    res,
    result,
    result.added ? 'Episódio adicionado à playlist.' : 'O episódio já estava na playlist.',
    result.added ? 201 : 200
  );
};

// DELETE /api/playlists/:id/episodes/:episodeId
exports.removeEpisode = async (req, res) => {
  const playlistId = parseId(req.params.id, 'playlist');
  const episodeId = parseId(req.params.episodeId, 'episódio');
  const result = await playlistService.removeFromPlaylist(req.user.id, playlistId, episodeId);
  return success(res, result, 'Episódio removido da playlist.');
};

// GET /api/episodes/:episodeId/playlists-status
exports.getPlaylistsStatus = async (req, res) => {
  const episodeId = parseId(req.params.episodeId, 'episódio');
  const playlists = await playlistService.getPlaylistsStatusForEpisode(req.user.id, episodeId);
  return success(res, playlists);
};
