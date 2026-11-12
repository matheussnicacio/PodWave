const { body, validationResult } = require('express-validator');
const { REPORT } = require('../../config/constants');

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

// Primeira defesa do motivo: só uma das cinco CHAVES. Ausente, fora da lista
// ou o RÓTULO ("Spam ou golpes") no lugar da chave ("spam") -> 400.
// A segunda defesa é o ENUM do banco.
exports.reportValidator = [
  body('reason')
    .isIn(REPORT.REASONS)
    .withMessage('Escolha um motivo válido para a denúncia.'),
  validate
];
