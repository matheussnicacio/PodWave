const express = require('express');
const router = express.Router();
const userController = require('./userController');
const { registerValidator, loginValidator } = require('./userValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');

router.post('/register', registerValidator, asyncHandler(userController.register));
router.post('/login', loginValidator, asyncHandler(userController.login));
router.post('/logout', asyncHandler(userController.logout));

// /profile/me precisa vir ANTES de /profile/:username, senão o Express
// entenderia "me" como valor do parâmetro :username e cairia na rota errada.
router.get('/profile/me', isAuthenticated, asyncHandler(userController.getMyProfile));
router.get('/profile/:username', asyncHandler(userController.getPublicProfile));

module.exports = router;
