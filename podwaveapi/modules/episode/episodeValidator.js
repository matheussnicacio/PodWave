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

// POST /episodes chega como multipart/form-data (por causa dos dois
// arquivos), mas o episodeMulter já rodou ANTES deste validador na rota e
// populou req.body com os campos de texto e req.files com os arquivos —
// então body('title')/body('description') funcionam normalmente, e os dois
// custom() abaixo leem req.files para os campos que não são texto.
exports.episodeUploadValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('O título é obrigatório.')
    .isLength({ max: VALIDATION.TITLE_MAX })
    .withMessage(`O título deve ter no máximo ${VALIDATION.TITLE_MAX} caracteres.`),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: VALIDATION.DESCRIPTION_MAX })
    .withMessage(`A descrição deve ter no máximo ${VALIDATION.DESCRIPTION_MAX} caracteres.`),
  body('audio')
    .custom((value, { req }) => {
      if (!req.files || !req.files.audio || req.files.audio.length === 0) {
        throw new Error('O arquivo de áudio é obrigatório.');
      }
      return true;
    }),
  body('cover')
    .custom((value, { req }) => {
      if (!req.files || !req.files.cover || req.files.cover.length === 0) {
        throw new Error('A imagem de capa é obrigatória.');
      }
      return true;
    }),
  validate
];
