const { verifyToken } = require('../config/jwt');

/**
 * Protege rotas que exigem usuário autenticado.
 * Espera o header: Authorization: Bearer <token>
 * Sem token ou com token inválido/expirado -> 401.
 * Com token válido -> anexa os dados decodificados em req.user e segue.
 */
function isAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Não autorizado. Token não informado.');
    error.status = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    const error = new Error('Não autorizado. Token inválido ou expirado.');
    error.status = 401;
    throw error;
  }
}

module.exports = isAuthenticated;
