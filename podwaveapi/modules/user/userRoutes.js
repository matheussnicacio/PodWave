const express = require('express');
const router = express.Router();
const userController = require('./userController');
const { registerValidator, loginValidator, profileUpdateValidator } = require('./userValidator');
const asyncHandler = require('../../middlewares/asyncHandler');
const isAuthenticated = require('../../middlewares/auth');
const profileMulter = require('../../middlewares/profileMulter');

router.post('/register', registerValidator, asyncHandler(userController.register));
router.post('/login', loginValidator, asyncHandler(userController.login));
router.post('/logout', asyncHandler(userController.logout));

// /profile/me precisa vir ANTES de /profile/:username, senão o Express
// entenderia "me" como valor do parâmetro :username e cairia na rota errada.
//
// Ordem dos middlewares em PUT /profile/me importa:
// 1) isAuthenticated       -> garante que existe um req.user antes de tudo.
// 2) profileMulter.single  -> faz o parsing do multipart/form-data,
//    salva a foto (se enviada) em disco e só então popula req.body com os
//    campos de texto (fullName, bio). Precisa vir ANTES do validador,
//    senão req.body ainda estaria vazio quando o express-validator rodasse.
// 3) profileUpdateValidator -> agora sim valida fullName/bio já parseados.
router.get('/profile/me', isAuthenticated, asyncHandler(userController.getMyProfile));
router.put(
  '/profile/me',
  isAuthenticated,
  profileMulter.single('profilePicture'),
  profileUpdateValidator,
  asyncHandler(userController.updateProfile)
);
router.get('/profile/:username', asyncHandler(userController.getPublicProfile));

module.exports = router;
