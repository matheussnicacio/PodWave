const express = require('express');
const router = express.Router();
const reportController = require('./reportController');
const { reportValidator } = require('./reportValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');

// Ordem: login (401) -> motivo (400) -> controller: id (400) -> 404 -> 400 (próprio) -> 409.
router.post('/episodes/:episodeId/report', isAuthenticated, reportValidator, asyncHandler(reportController.reportEpisode));

module.exports = router;
