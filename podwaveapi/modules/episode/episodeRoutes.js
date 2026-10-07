const express = require('express');
const router = express.Router();
const episodeController = require('./episodeController');
const { episodeUploadValidator, episodeUpdateValidator } = require('./episodeValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');
const optionalAuth = require('../../middlewares/optionalAuth');
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

// Episódios do usuário logado.
router.get('/my-episodes', isAuthenticated, asyncHandler(episodeController.getMyEpisodes));

// Dados para o formulário de edição (só o dono: 404 se não existe, 403 se não é seu).
router.get('/episodes/:id/edit', isAuthenticated, asyncHandler(episodeController.getEpisodeForEdit));

// Edição: Multer ANTES do validador (mesma razão do POST: o multipart só vira
// req.body depois do multer). single('cover'): só a capa pode ser trocada.
// Se auth/validador/serviço falharem depois de o multer gravar a capa nova,
// o errorHandler apaga esse arquivo órfão.
router.put(
  '/episodes/:id',
  isAuthenticated,
  episodeMulter.single('cover'),
  episodeUpdateValidator,
  asyncHandler(episodeController.updateEpisode)
);

router.delete('/episodes/:id', isAuthenticated, asyncHandler(episodeController.deleteEpisode));

// Detalhe: PÚBLICO, mas com optionalAuth — tenta identificar o usuário (para
// calcular isOwner) sem nunca devolver 401.
router.get('/episodes/:id', optionalAuth, asyncHandler(episodeController.getEpisodeDetails));

// Streaming com Range: protegido por isAuthenticated. ATENÇÃO — essa proteção
// é só da ROTA: o mesmo arquivo continua público em /uploads/episodes/audio/...
// (express.static no app.js, sem nenhum middleware de auth). É a inconsistência
// de arquitetura discutida no roteiro da Shortz-App; por isso o player do
// frontend aponta para o caminho estático, não para este endpoint (um
// <audio src> não consegue enviar o header Authorization).
router.get('/episodes/:id/stream', isAuthenticated, asyncHandler(episodeController.streamEpisode));

module.exports = router;
