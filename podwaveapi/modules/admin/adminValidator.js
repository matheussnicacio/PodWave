const { query, body, validationResult } = require('express-validator');
const { ADMIN } = require('../../config/constants');

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

// GET /api/admin/reports?status=pending|reviewed|all
// Ausente = 'pending' (decidido no controller). Qualquer outro valor -> 400:
// um filtro com erro de digitação ("pendng") devolvendo a lista inteira
// esconderia o erro de quem chamou.
exports.reportsFilterValidator = [
  query('status')
    .optional()
    .isIn(ADMIN.REPORT_FILTERS)
    .withMessage('Filtro de situação inválido. Use pending, reviewed ou all.'),
  validate
];

// PATCH /api/admin/users/:id/block   corpo: { "isBlocked": true | false }
//  - .exists()  -> corpo vazio ({}) é 400, e não "desbloquear sem querer";
//  - .bail()    -> para na primeira falha (uma mensagem só);
//  - .isBoolean({ strict: true }) -> só o BOOLEANO true/false do JSON. Sem o
//    strict, o texto "true" (e até "1", "0", "yes") passaria — e o texto
//    "false" é truthy em JavaScript: `if ("false")` entra no if.
exports.blockUserValidator = [
  body('isBlocked')
    .exists()
    .withMessage('Informe isBlocked (true ou false).')
    .bail()
    .isBoolean({ strict: true })
    .withMessage('isBlocked deve ser um booleano (true ou false).'),
  validate
];
