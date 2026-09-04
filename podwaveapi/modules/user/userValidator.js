const { body, validationResult } = require('express-validator');
const { VALIDATION } = require('../../config/constants');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const firstError = errors.array()[0].msg;
  const error = new Error(firstError);
  error.status = 400;
  error.errors = errors.array();
  throw error;
};

exports.registerValidator = [
  body('username')
    .isLength({ min: VALIDATION.USERNAME_MIN, max: VALIDATION.USERNAME_MAX })
    .withMessage(`O nome de usuário deve ter entre ${VALIDATION.USERNAME_MIN} e ${VALIDATION.USERNAME_MAX} caracteres.`)
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Por favor, insira um e-mail válido.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: VALIDATION.PASSWORD_MIN })
    .withMessage(`A senha deve ter pelo menos ${VALIDATION.PASSWORD_MIN} caracteres.`),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('As senhas não coincidem.');
      }
      return true;
    }),
  body('fullName')
    .notEmpty().withMessage('O nome completo é obrigatório.')
    .trim(),
  validate
];

exports.loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Por favor, insira um e-mail válido.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('A senha é obrigatória.'),
  validate
];

// PUT /profile/me chega como multipart/form-data (por causa da foto
// opcional), mas o multer já roda ANTES deste validador na rota e popula
// req.body com os campos de texto normalmente — então body('fullName') e
// body('bio') funcionam exatamente como em qualquer outra rota JSON.
exports.profileUpdateValidator = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('O nome completo é obrigatório.'),
  body('bio')
    .optional({ checkFalsy: true })
    .trim()
    // VALIDATION.BIO_MAX, não VALIDATION.USERNAME_MAX: bio é um campo
    // diferente, com seu próprio limite (bate com bio STRING(255) no
    // userModel.js). Usar a constante errada aqui é exatamente o erro
    // sutil que essa constante nova existe para evitar.
    .isLength({ max: VALIDATION.BIO_MAX })
    .withMessage(`A bio deve ter no máximo ${VALIDATION.BIO_MAX} caracteres.`),
  validate
];
