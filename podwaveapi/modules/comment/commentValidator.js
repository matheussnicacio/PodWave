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

// .trim() PRIMEIRO, .notEmpty() depois: o express-validator executa a cadeia
// na ordem em que foi escrita. Com notEmpty() antes do trim(), um comentário
// só de espaços ("   ") passaria na checagem (tem 3 caracteres) e só depois
// seria aparado para "" — chegaria vazio ao banco. Aparando antes, "   "
// vira "" e o notEmpty() o recusa; e isLength conta o texto já aparado.
exports.commentValidator = [
  body('content')
    .trim()
    .notEmpty().withMessage('O comentário não pode ser vazio.')
    .isLength({ max: VALIDATION.COMMENT_MAX })
    .withMessage(`O comentário deve ter no máximo ${VALIDATION.COMMENT_MAX} caracteres.`),
  validate
];
