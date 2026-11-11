const { body, validationResult } = require('express-validator');
const { VALIDATION } = require('../../config/constants');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const error = new Error(errors.array()[0].msg);
  error.status = 400;
  error.errors = errors.array();
  throw error;
};

// .trim() ANTES de .notEmpty(): "   " vira "" e é recusado (sem o trim, só
// espaços passaria como título válido). O trim também SANITIZA: o controller
// recebe req.body.title já sem os espaços das pontas.
//
// isPublic: .isBoolean({ strict: true }) aceita só true/false (JSON) — sem o
// strict, "sim", "1" e "yes" teriam outro tratamento. Ausente é permitido
// (.optional()): o service usa o padrão false.
exports.createPlaylistValidator = [
  body('title')
    .isString().withMessage('O título da playlist é obrigatório.')
    .bail()
    .trim()
    .notEmpty().withMessage('O título da playlist é obrigatório.')
    .bail()
    .isLength({ min: VALIDATION.PLAYLIST_TITLE_MIN, max: VALIDATION.PLAYLIST_TITLE_MAX })
    .withMessage(`O título deve ter entre ${VALIDATION.PLAYLIST_TITLE_MIN} e ${VALIDATION.PLAYLIST_TITLE_MAX} caracteres.`),
  body('description')
    .optional({ checkFalsy: true })
    .isString().withMessage('A descrição deve ser um texto.')
    .bail()
    .trim()
    .isLength({ max: VALIDATION.PLAYLIST_DESCRIPTION_MAX })
    .withMessage(`A descrição deve ter no máximo ${VALIDATION.PLAYLIST_DESCRIPTION_MAX} caracteres.`),
  body('isPublic')
    .optional()
    .isBoolean({ strict: true }).withMessage('O campo isPublic deve ser true ou false.'),
  validate
];
