const { verifyToken } = require('../config/jwt');
const User = require('../modules/user/userModel');

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Mesma mensagem nas duas checagens do bloqueio (login e aqui): quem foi
// bloqueado vê o mesmo texto, venha de onde vier.
const BLOCKED_MESSAGE = 'Sua conta foi bloqueada. Entre em contato com a administração.';

/**
 * AUTENTICAÇÃO: "quem é você?" — Aula 15: agora consulta o BANCO.
 *
 * Espera o header: Authorization: Bearer <token>
 *  - sem token, token inválido ou expirado      -> 401
 *  - token válido, mas a conta foi APAGADA      -> 401
 *  - token válido, mas a conta foi BLOQUEADA    -> 401 (com a mensagem do bloqueio)
 *  - tudo certo -> req.user = { id, username, isAdmin } montado A PARTIR DO BANCO
 *
 * Por que consultar o banco em vez de confiar no token: o token é uma
 * "fotografia" do momento do login, válida até expirar (1 dia). Se o
 * isAuthenticated só lesse o token, um usuário bloqueado continuaria usando
 * o token antigo até ele expirar, um administrador rebaixado continuaria
 * entrando no painel, e uma conta apagada continuaria "existindo" para a API.
 * Com a consulta, a mudança vale na PRÓXIMA requisição. O custo é uma
 * consulta por chave primária a cada requisição autenticada (barata, mas não
 * gratuita). As alternativas seriam tokens de vida curta (com refresh token)
 * ou uma lista de tokens revogados (blacklist) — as duas mais complexas.
 *
 * Por que async + next(err) em vez de throw: dentro de uma função async, um
 * throw vira uma promessa rejeitada. O Express 5 encaminha essa rejeição ao
 * errorHandler, mas mandar explicitamente para o next(err) deixa o fluxo
 * claro e não depende disso.
 *
 * Dois try/catch, de propósito:
 *  1) o primeiro envolve SÓ a verificação do token: qualquer falha ali é
 *     "token ruim" (401);
 *  2) o segundo envolve a consulta: uma falha ali (banco fora do ar) NÃO é
 *     culpa do token e não pode virar 401 — vai para o next(err) como 500.
 */
async function isAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(httpError('Não autorizado. Token não informado.', 401));
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return next(httpError('Não autorizado. Token inválido ou expirado.', 401));
  }

  try {
    // Só as quatro colunas necessárias (nunca password).
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'isAdmin', 'isBlocked']
    });

    if (!user) {
      return next(httpError('Não autorizado. Usuário não encontrado.', 401));
    }

    if (user.isBlocked) {
      return next(httpError(BLOCKED_MESSAGE, 401));
    }

    // O papel vem do BANCO, não do token: o isAdmin do payload pode estar
    // desatualizado (promovido ou rebaixado depois do login).
    req.user = { id: user.id, username: user.username, isAdmin: user.isAdmin };
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * AUTORIZAÇÃO: "você PODE fazer isto?" — só administradores (403).
 *
 * Precisa vir DEPOIS do isAuthenticated: é ele quem monta o req.user. Antes
 * dele, req.user não existe e TODO MUNDO (até o administrador) receberia 403.
 * 401 = não sei quem você é; 403 = sei quem você é, mas você não pode.
 */
function isAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return next(httpError('Acesso restrito a administradores.', 403));
  }
  return next();
}

// Exportação compatível com as rotas antigas: elas fazem
//   const isAuthenticated = require('../../middlewares/auth');
// e continuam funcionando sem nenhuma alteração. As rotas novas podem fazer
//   const { isAuthenticated, isAdmin } = require('../../middlewares/auth');
module.exports = isAuthenticated;
module.exports.isAuthenticated = isAuthenticated;
module.exports.isAdmin = isAdmin;
module.exports.BLOCKED_MESSAGE = BLOCKED_MESSAGE;
