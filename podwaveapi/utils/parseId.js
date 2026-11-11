/**
 * Converte um identificador vindo de fora (req.params, req.body) em inteiro
 * positivo, ou lança 400 "Identificador de <label> inválido.".
 *
 * Por que na borda (controller): tudo que vem da URL é STRING. Comparar
 * `5 === "5"` dá false, e "abc" chegando ao banco vira erro 500 ou uma busca
 * sem sentido. Convertendo uma vez, na entrada, service e banco trabalham só
 * com número — e lixo ("abc", "1.5", "-3", "0", "") vira 400 com mensagem clara.
 *
 * A regex /^\d+$/ recusa sinais, pontos, espaços e notação científica
 * ("1e3"), que Number() aceitaria. Number.isSafeInteger recusa números grandes
 * demais para serem representados com exatidão.
 *
 * @param {any} rawValue — req.params.id, req.body.episodeId...
 * @param {string} label — o nome da coisa na mensagem ("usuário", "playlist"...)
 * @returns {number}
 */
function parseId(rawValue, label) {
  const text = String(rawValue);
  const id = Number(text);

  if (!/^\d+$/.test(text) || !Number.isSafeInteger(id) || id < 1) {
    const error = new Error(`Identificador de ${label} inválido.`);
    error.status = 400;
    throw error;
  }
  return id;
}

module.exports = { parseId };
