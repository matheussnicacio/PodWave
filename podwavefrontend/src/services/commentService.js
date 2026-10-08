import api from './api'

// Lista pública: mais novos primeiro.
export function getComments(episodeId) {
  return api.get(`/episodes/${episodeId}/comments`)
}

// Exige login. A API devolve o comentário criado JÁ com o autor, para a tela
// poder mostrá-lo no topo sem recarregar a lista.
export function createComment(episodeId, content) {
  return api.post(`/episodes/${episodeId}/comments`, { content })
}
