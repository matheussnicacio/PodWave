const express = require('express');
const router = express.Router();
const searchController = require('./searchController');
const asyncHandler = require('../../middlewares/asyncHandler');

// Busca global. Rota pública. asyncHandler: um erro do banco vira resposta do
// errorHandler em vez de uma promessa rejeitada sem ninguém para tratá-la.
router.get('/search', asyncHandler(searchController.search));

module.exports = router;
