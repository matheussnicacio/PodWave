/**
 * Camada de acesso a dados do módulo de busca.
 *
 * Hoje (Aula 02) ainda não existe conexão com banco de dados — por isso
 * esta função devolve sempre listas vazias. A partir da trilha da Aula 13,
 * este é o único arquivo que vai mudar para consultar o banco de verdade
 * por itens e usuários que combinem com o termo buscado.
 */
function globalSearch(query) {
  return { podcasts: [], users: [] };
}

module.exports = { globalSearch };
