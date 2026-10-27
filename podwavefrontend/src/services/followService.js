import api from './api'

// Alterna "o usuário logado segue o usuário `userId`". A API responde
// { isFollowing, followersCount } em data: isFollowing é o estado NOVO e
// followersCount o contador REAL de seguidores do alvo depois da operação.
export function toggleFollow(userId) {
  return api.post(`/users/${userId}/toggle-follow`)
}

// Quem SEGUE `userId` (rota pública). Cada item é uma pessoa
// ({ id, username, fullName, bio, profilePicture }).
export function getFollowers(userId) {
  return api.get(`/users/${userId}/followers`)
}

// Quem `userId` SEGUE (rota pública). Mesmo formato de item.
export function getFollowing(userId) {
  return api.get(`/users/${userId}/following`)
}

// Uma página do feed de QUEM EU SIGO. Como no Feed geral, a API devolve um
// array em data; array vazio = não há mais itens (ou não sigo ninguém).
export function getFollowingEpisodes(page = 1, limit = 8) {
  return api.get('/following-episodes', { params: { page, limit } })
}
