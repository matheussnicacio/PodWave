const { PAGINATION } = require('../config/constants');

/**
 * Normaliza ?page= e ?limit= de um feed.
 *
 * Regra: qualquer valor ausente, não numérico, zero ou negativo cai no padrão;
 * o limit nunca passa de PAGINATION.MAX_LIMIT.
 *
 * Por que Number.parseInt + Number.isInteger + ">= 1":
 *  - Number.parseInt('abc', 10) devolve NaN, e NaN >= 1 é false — então lixo
 *    ("abc", "", undefined) cai sozinho no padrão, sem um if específico;
 *  - ">= 1" (e NÃO "> 1"): ?limit=1 é um pedido válido. Com "> 1" ele cairia
 *    para o padrão (12) e ?page=2&limit=1 devolveria a lista errada;
 *  - parseInt('3.7') vira 3 e parseInt('5abc') vira 5: aceitável (nunca
 *    gera um valor perigoso). O que importa é que negativo/zero/NaN nunca
 *    chegam ao banco (?limit=-3 gerava erro 500 / ?page=-2 gerava offset negativo).
 *
 * @param {{ page?: any, limit?: any }} query — normalmente req.query
 * @returns {{ page: number, limit: number }}
 */
function parsePagination(query = {}) {
  const page = Number.parseInt(query.page, 10);
  const limit = Number.parseInt(query.limit, 10);

  return {
    page: Number.isInteger(page) && page >= 1 ? page : PAGINATION.DEFAULT_PAGE,
    limit: Number.isInteger(limit) && limit >= 1
      ? Math.min(limit, PAGINATION.MAX_LIMIT)
      : PAGINATION.DEFAULT_LIMIT
  };
}

module.exports = { parsePagination };
