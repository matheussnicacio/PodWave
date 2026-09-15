const episodeService = require('./episodeService');
const { success } = require('../../middlewares/apiResponse');

exports.uploadEpisode = async (req, res) => {
  const { title, description } = req.body;

  // req.files (plural, com "s") é o que multer.fields([...]) popula — cada
  // chave é o nome de um campo de arquivo, e o valor é sempre um array
  // (mesmo quando o campo aceita só um arquivo, como aqui: maxCount 1).
  // Isso é diferente de multer.single(...), que popula req.file (singular),
  // já usado em PUT /profile/me.
  const audioFilename = req.files.audio[0].filename;
  const coverFilename = req.files.cover[0].filename;

  const newEpisode = await episodeService.createEpisode(req.user.id, {
    title,
    description,
    audioFilename,
    coverFilename
  });

  return success(res, newEpisode, 'Episódio publicado com sucesso!', 201);
};
