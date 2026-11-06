const reportService = require('./reportService');
const { parseId } = require('../../utils/parseId');
const { success } = require('../../middlewares/apiResponse');

// POST /api/episodes/:episodeId/report   corpo: { "reason": "spam" }
// Responde só { id, episodeId, reason }: quem denunciou já sabe quem é, e
// não há por que devolver datas ou ids internos.
exports.reportEpisode = async (req, res) => {
  const episodeId = parseId(req.params.episodeId, 'episódio');
  const report = await reportService.reportEpisode(req.user.id, episodeId, req.body.reason);
  return success(
    res,
    { id: report.id, episodeId: report.episodeId, reason: report.reason },
    'Denúncia enviada. Obrigado por avisar a moderação.',
    201
  );
};
