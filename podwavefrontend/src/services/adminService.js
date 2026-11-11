import api from './api'

// Aula 15 — painel de administração. As sete chamadas das rotas /api/admin.
//
// SEM { silent: true } em nenhuma: as leituras (GET) mostram o erro na TELA
// (useAsyncData/usePaginatedList — o interceptor já não faz toast de GET), e as
// AÇÕES (revisar, bloquear, excluir) querem justamente o toast vermelho do
// interceptor quando falham. As telas só fazem toast.success.

export function getAdminDashboard() {
  return api.get('/admin/dashboard')
}

// status: 'pending' | 'reviewed' | 'all'. O Axios monta a query string e
// descarta parâmetros undefined (limit vem do usePaginatedList).
export function getAdminReports(status, page, limit) {
  return api.get('/admin/reports', { params: { status, page, limit } })
}

// PATCH sem corpo: SEM segundo argumento (nunca `null` — o Axios mandaria o
// texto "null" como JSON e o express.json() recusaria com 400, como no logout
// da Aula 14). Não há config para passar, então basta a URL.
export function reviewAdminReport(id) {
  return api.patch(`/admin/reports/${id}/review`)
}

export function getAdminUsers(search, page, limit) {
  return api.get('/admin/users', { params: { search, page, limit } })
}

// isBlocked é o BOOLEANO true/false (a API recusa o texto "true" com 400).
export function setUserBlocked(id, isBlocked) {
  return api.patch(`/admin/users/${id}/block`, { isBlocked })
}

export function getAdminEpisodes(search, page, limit) {
  return api.get('/admin/episodes', { params: { search, page, limit } })
}

export function deleteAdminEpisode(id) {
  return api.delete(`/admin/episodes/${id}`)
}
