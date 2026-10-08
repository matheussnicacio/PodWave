import api from './api'

// Alterna a curtida do usuário logado no episódio. A API responde
// { liked, likesCount } em data: liked é o estado NOVO e likesCount o valor
// real do contador depois da operação.
export function toggleLike(episodeId) {
  return api.post(`/episodes/${episodeId}/toggle-like`)
}

// Rota pública (optionalAuth): visitante recebe liked: false.
export function getLikeStatus(episodeId) {
  return api.get(`/episodes/${episodeId}/like-status`)
}

// Episódios curtidos pelo usuário logado (cada um com o autor).
export function getLikedEpisodes() {
  return api.get('/liked-episodes')
}
