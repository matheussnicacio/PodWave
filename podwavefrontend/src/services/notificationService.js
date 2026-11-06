import api from './api'
import { PAGE_SIZE } from '../config/constants'

// Uma página das minhas notificações (mais nova primeiro). Array vazio = fim.
export function getNotifications(page = 1, limit = PAGE_SIZE) {
  return api.get('/notifications', { params: { page, limit } })
}

// Só o número de não lidas ({ unreadCount }): é o que o sino pergunta a cada
// 30 s. Leitura: se falhar, nenhum toast (o sino só mantém o último número).
export function getUnreadCount() {
  return api.get('/notifications/unread-count')
}

// Marcar como lida: AÇÃO. Se falhar, o toast vem do interceptor. A API
// devolve { id, isRead: true, unreadCount } — o número REAL depois da escrita.
export function markNotificationAsRead(id) {
  return api.patch(`/notifications/${id}/read`)
}
