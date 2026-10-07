const fs = require('fs');
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

// GET /api/episodes/:id — rota pública com optionalAuth. req.user?.id é
// undefined para visitante e o id do usuário quando há token válido.
exports.getEpisodeDetails = async (req, res) => {
  const episode = await episodeService.getEpisodeDetails(req.params.id, req.user?.id);
  return success(res, episode);
};

// GET /api/my-episodes — episódios do usuário logado (mais novo primeiro).
exports.getMyEpisodes = async (req, res) => {
  const episodes = await episodeService.getMyEpisodes(req.user.id);
  return success(res, episodes);
};

// GET /api/episodes/:id/edit — dados para pré-preencher o formulário (só dono).
exports.getEpisodeForEdit = async (req, res) => {
  const episode = await episodeService.getEpisodeForEdit(req.params.id, req.user.id);
  return success(res, episode);
};

// PUT /api/episodes/:id — req.file só existe se uma capa nova foi enviada
// (multer.single('cover')).
exports.updateEpisode = async (req, res) => {
  const { title, description } = req.body;
  const updated = await episodeService.updateEpisode(req.params.id, req.user.id, {
    title,
    description,
    newCoverFilename: req.file ? req.file.filename : undefined
  });
  return success(res, updated, 'Episódio atualizado com sucesso.');
};

// DELETE /api/episodes/:id
exports.deleteEpisode = async (req, res) => {
  await episodeService.deleteEpisode(req.params.id, req.user.id);
  return success(res, null, 'Episódio excluído com sucesso.');
};

// GET /api/episodes/:id/stream — streaming com suporte a Range (206).
//
// Por que Range importa: um mp3 pode ter dezenas de MB. Sem Range, o servidor
// teria de mandar o arquivo inteiro de novo toda vez que o ouvinte arrastasse
// a barra de progresso. Com Range, o player pede só o pedaço que quer
// ("Range: bytes=1000000-"), o servidor responde 206 Partial Content com
// Content-Range, e o seek é quase instantâneo.
exports.streamEpisode = async (req, res) => {
  const { filePath, size } = await episodeService.getEpisodeAudioFile(req.params.id);

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Accept-Ranges', 'bytes');

  const range = req.headers.range;

  // Sem Range: arquivo inteiro, 200.
  if (!range) {
    res.status(200);
    res.setHeader('Content-Length', size);
    return fs.createReadStream(filePath).pipe(res);
  }

  // Formatos aceitos: "bytes=0-1023", "bytes=500-" (até o fim) e
  // "bytes=-500" (últimos 500 bytes).
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  let start;
  let end;

  if (match && (match[1] !== '' || match[2] !== '')) {
    if (match[1] === '') {
      const suffix = parseInt(match[2], 10);
      start = Math.max(size - suffix, 0);
      end = size - 1;
    } else {
      start = parseInt(match[1], 10);
      end = match[2] === '' ? size - 1 : Math.min(parseInt(match[2], 10), size - 1);
    }
  }

  // Range malformado ou fora do arquivo: 416 Range Not Satisfiable.
  if (start === undefined || start >= size || start > end) {
    res.status(416);
    res.setHeader('Content-Range', `bytes */${size}`);
    return res.end();
  }

  res.status(206);
  res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
  res.setHeader('Content-Length', end - start + 1);
  return fs.createReadStream(filePath, { start, end }).pipe(res);
};
