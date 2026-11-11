const searchService = require('./searchService');
const { SEARCH } = require('../../config/constants');
const { success } = require('../../middlewares/apiResponse');

// GET /api/search?q=...
//
// Entrada tratada antes de chegar ao banco:
//  - typeof === 'string': ?q=ab&q=cd chega como ARRAY e ?q[x]=1 pode chegar
//    como OBJETO (conforme o parser de query). .trim() num array lança
//    TypeError (500). Qualquer coisa que não seja texto vira '' (listas vazias).
//  - trim + slice(0, MAX_LENGTH): espaços das pontas não contam e um texto
//    enorme não vira um LIKE caro.
//  - só consulta com MIN_LENGTH ou mais: 1 letra casaria com quase tudo.
//
// `async` + `await`: sem o await, `results` seria uma PROMESSA, e
// `...results` espalharia as propriedades da promessa (nenhuma) — resposta
// 200, com `query`, mas sem as listas.
exports.search = async (req, res) => {
  const raw = typeof req.query.q === 'string' ? req.query.q : '';
  const query = raw.trim().slice(0, SEARCH.MAX_LENGTH);

  let results = { podcasts: [], users: [] };
  if (query.length >= SEARCH.MIN_LENGTH) {
    results = await searchService.globalSearch(query);
  }

  return success(res, { query, ...results });
};
