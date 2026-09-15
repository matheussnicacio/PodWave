const express = require('express');
const router = express.Router();
const episodeController = require('./episodeController');
const { episodeUploadValidator } = require('./episodeValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');
const episodeMulter = require('../../middlewares/episodeMulter');

// Ordem dos middlewares importa, e é sempre a mesma lógica de PUT /profile/me:
// 1) isAuthenticated    -> garante que existe um req.user (o autor do
//    episódio) antes de qualquer outra coisa.
// 2) episodeMulter      -> faz o parsing do multipart/form-data, salva
//    áudio e capa em disco e só então popula req.body com os campos de
//    texto (title, description). Precisa vir ANTES do validador, senão
//    req.body/req.files ainda estariam vazios quando o express-validator
//    rodasse.
// 3) episodeUploadValidator -> valida title/description já parseados, e
//    confere que os dois arquivos chegaram em req.files.
router.post(
  '/episodes',
  isAuthenticated,
  episodeMulter.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  episodeUploadValidator,
  asyncHandler(episodeController.uploadEpisode)
);

module.exports = router;
