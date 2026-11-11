const adminService = require('./adminService');
const episodeService = require('../episode/episodeService');
const { parsePagination } = require('../../utils/pagination');
const { parseId } = require('../../utils/parseId');
const { success } = require('../../middlewares/apiResponse');
const { SEARCH } = require('../../config/constants');

// Lê ?search= sem nunca quebrar: só aceita TEXTO. ?search=a&search=b chega
// como array (o Express monta um array quando o parâmetro se repete) — aí
// tratamos como "sem busca", em vez de um 500 no .trim(). Corta no
// SEARCH.MAX_LENGTH, como a busca pública.
function readSearch(value) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, SEARCH.MAX_LENGTH);
}

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  const stats = await adminService.getDashboardStats();
  return success(res, stats);
};

// GET /api/admin/reports?status=pending|reviewed|all&page=&limit=
// Sem status = 'pending': é o que o moderador quer ver ao abrir a tela.
exports.getReports = async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const status = req.query.status || 'pending';
  const reports = await adminService.getReports(status, page, limit);
  return success(res, reports);
};

// PATCH /api/admin/reports/:id/review
exports.reviewReport = async (req, res) => {
  const reportId = parseId(req.params.id, 'denúncia');
  const report = await adminService.reviewReport(reportId);
  return success(res, report, 'Denúncia marcada como revisada.');
};

// GET /api/admin/users?search=&page=&limit=
exports.getUsers = async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const users = await adminService.getUsers(readSearch(req.query.search), page, limit);
  return success(res, users);
};

// PATCH /api/admin/users/:id/block   corpo: { "isBlocked": true | false }
// O adminId vem do TOKEN (req.user.id, conferido no banco pelo
// isAuthenticated) — nunca do corpo.
exports.setUserBlocked = async (req, res) => {
  const userId = parseId(req.params.id, 'usuário');
  const result = await adminService.setUserBlocked(userId, req.body.isBlocked, req.user.id);
  return success(res, result, result.isBlocked ? 'Usuário bloqueado.' : 'Usuário desbloqueado.');
};

// GET /api/admin/episodes?search=&page=&limit=
exports.getEpisodes = async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const episodes = await adminService.getEpisodes(readSearch(req.query.search), page, limit);
  return success(res, episodes);
};

// DELETE /api/admin/episodes/:id
// Reaproveita o deleteEpisode da Aula 09 com isAdmin = true (último
// argumento): a mesma limpeza das cinco tabelas, do contador do dono e dos
// arquivos. Nenhum destroy novo aqui.
exports.deleteEpisode = async (req, res) => {
  const episodeId = parseId(req.params.id, 'episódio');
  await episodeService.deleteEpisode(episodeId, req.user.id, true);
  return success(res, null, 'Episódio excluído pela administração.');
};
