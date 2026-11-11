/**
 * Escapa os curingas do LIKE: % (qualquer sequência), _ (qualquer caractere)
 * e a própria barra invertida (o caractere de escape do MySQL).
 *
 * Sem isso, quem digita "%%" monta `LIKE '%%%%'` — que casa com QUALQUER
 * texto e devolve a tabela inteira. Com o escape, "%%" vira `LIKE '%\%\%%'`:
 * procura o texto literal "%%".
 *
 * A barra entra na lista (e é escapada primeiro, pela própria classe [\\%_])
 * para que um "\" digitado não "escape" o curinga que nós mesmos adicionamos.
 *
 * Aula 15: extraída do searchService para cá porque passou a ter DOIS usos —
 * a busca pública (searchService) e as buscas do painel (adminService:
 * usuários e episódios). Duas cópias da mesma regra de segurança divergiriam
 * na primeira correção feita em só uma delas.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeLike(text) {
  return String(text).replace(/[\\%_]/g, '\\$&');
}

module.exports = { escapeLike };
