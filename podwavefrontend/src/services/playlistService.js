import api from './api'

// Playlists (Aula 13): a "coleção" do PodWave — uma lista pessoal de
// episódios de qualquer autor. Sete funções, uma por rota da API.

// As playlists do usuário logado (mais nova primeiro).
export function getMyPlaylists() {
  return api.get('/my-playlists')
}

// Cria uma playlist. `silent: true` no 3º argumento (a CONFIG do post): o
// erro de criação é do FORMULÁRIO (mostrado dentro do modal), não um toast.
export function createPlaylist({ title, description, isPublic }) {
  return api.post('/playlists', { title, description, isPublic }, { silent: true })
}

// Detalhe (rota pública com optionalAuth): pública para todos, privada só para
// a dona. 403/404 viram mensagem na própria tela (é uma leitura: sem toast).
export function getPlaylistById(id) {
  return api.get(`/playlists/${id}`)
}

export function deletePlaylist(id) {
  return api.delete(`/playlists/${id}`)
}

// Adicionar: o id do episódio vai no CORPO. A API é idempotente
// (201 na primeira vez, 200 se já estava).
export function addEpisodeToPlaylist(playlistId, episodeId) {
  return api.post(`/playlists/${playlistId}/episodes`, { episodeId })
}

// Remover: o id do episódio vai na URL (DELETE não leva corpo de forma confiável).
export function removeEpisodeFromPlaylist(playlistId, episodeId) {
  return api.delete(`/playlists/${playlistId}/episodes/${episodeId}`)
}

// As minhas playlists, cada uma com hasEpisode (o episódio já está nela?).
export function getPlaylistsStatus(episodeId) {
  return api.get(`/episodes/${episodeId}/playlists-status`)
}
