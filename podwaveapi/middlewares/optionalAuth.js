const { verifyToken } = require('../config/jwt');

/**
 * Autenticação OPCIONAL: tenta identificar quem está pedindo, mas NUNCA bloqueia.
 *
 * Diferença para isAuthenticated (middlewares/auth.js):
 *  - isAuthenticated: sem token (ou token inválido) -> 401, a rota nem executa.
 *  - optionalAuth:    sem token (ou token inválido) -> segue em frente com
 *                     req.user === undefined; com token válido -> req.user
 *                     preenchido, exatamente como no isAuthenticated.
 *
 * É o que o detalhe do episódio precisa: a rota é pública (qualquer visitante
 * pode ver o episódio), mas, se quem pede for logado, o controller consegue
 * comparar req.user.id com episode.userId e responder isOwner: true/false.
 *
 * Token inválido/expirado é tratado como "visitante": a rota é pública, então
 * um token ruim não pode impedir ninguém de ver o conteúdo.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyToken(token);
    } catch (err) {
      // ignora: segue como visitante
    }
  }

  return next();
}

module.exports = optionalAuth;
