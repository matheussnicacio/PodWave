const express = require('express');
const router = express.Router();
const adminController = require('./adminController');
const { reportsFilterValidator, blockUserValidator } = require('./adminValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const { isAuthenticated, isAdmin } = require('../../middlewares/auth');

// UMA guarda para o módulo inteiro: tudo que começa com /admin passa por
// isAuthenticated (401: quem é você?) e DEPOIS por isAdmin (403: você pode?).
//  - Uma linha aqui, e não um isAdmin em cada rota: a rota nova que alguém
//    acrescentar amanhã já nasce protegida; esquecer o middleware numa rota
//    não é possível.
//  - A ordem importa: isAdmin lê req.user, que só existe depois do
//    isAuthenticated. Invertidos, até o administrador receberia 403.
//  - Vale também para /admin/rota-inexistente: 401/403 antes do 404 (quem
//    não é administrador não descobre quais rotas existem no painel).
router.use('/admin', isAuthenticated, isAdmin);

router.get('/admin/dashboard', asyncHandler(adminController.getDashboard));

router.get('/admin/reports', reportsFilterValidator, asyncHandler(adminController.getReports));
router.patch('/admin/reports/:id/review', asyncHandler(adminController.reviewReport));

router.get('/admin/users', asyncHandler(adminController.getUsers));
router.patch('/admin/users/:id/block', blockUserValidator, asyncHandler(adminController.setUserBlocked));

router.get('/admin/episodes', asyncHandler(adminController.getEpisodes));
router.delete('/admin/episodes/:id', asyncHandler(adminController.deleteEpisode));

module.exports = router;
