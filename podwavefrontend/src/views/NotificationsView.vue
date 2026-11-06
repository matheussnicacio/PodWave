<script setup>
// Checagem de alcançabilidade (Atividade 14, Seção 8) — caminhos de clique:
//  - Notificações: sino na Navbar (todas as telas, só para quem está logado) e Sidebar
//  - Marcar como lida: botão na linha e clique na própria notificação
//  - Ir ao que gerou o aviso: clique no texto -> episódio (curtir/comentar) ou perfil (seguir)
//  - Mais antigas / novas: "Carregar mais notificações" no fim / "Atualizar" no topo
//  - Denunciar: botão "Denunciar" no detalhe do episódio (visitante -> login -> volta; o dono não vê)
import { reactive } from 'vue'
import { getNotifications, markNotificationAsRead } from '../services/notificationService'
import { usePaginatedList } from '../composables/usePaginatedList'
import { useNotificationsStore } from '../stores/notifications'
import { runOptimistic } from '../utils/optimistic'
import { NOTIFICATION_TEXT } from '../config/constants'
import { getProfilePictureUrl } from '../utils/media'
import { formatDateTime } from '../utils/format'

const notificationsStore = useNotificationsStore()

const { items: notifications, hasMore, isLoading, error, isEmpty, loadMore, reload } =
  usePaginatedList(getNotifications)

// "Cerca" POR LINHA: ids com requisição em andamento (Set reativo).
// Clique duplo na mesma linha = uma requisição.
const busyIds = reactive(new Set())

// QUARTO caso do runOptimistic (sem mexer em utils/optimistic.js).
// O que muda: são DOIS lugares a atualizar — a linha e o sino (que mora na
// store). E o desfazer do sino é RELATIVO (+1), não "volte ao número que eu
// vi": se duas linhas falharem juntas, cada uma devolve 1 e o sino volta ao
// número do começo. Se cada uma voltasse ao número que viu, a segunda
// restauraria um valor que já incluía a primeira, e o sino ficaria errado.
function markAsRead(notification) {
  if (notification.isRead || busyIds.has(notification.id)) return
  busyIds.add(notification.id)

  runOptimistic({
    apply: () => {
      notification.isRead = true
      notificationsStore.setUnreadCount(Math.max(0, notificationsStore.unreadCount - 1))
      return () => {
        notification.isRead = false
        notificationsStore.setUnreadCount(notificationsStore.unreadCount + 1)
      }
    },
    request: () => markNotificationAsRead(notification.id),
    // O servidor é a fonte da verdade: a linha e o número REAL de não lidas.
    confirm: (data) => {
      notification.isRead = data.isRead
      notificationsStore.setUnreadCount(data.unreadCount)
    },
  }).finally(() => busyIds.delete(notification.id))
}

// Para onde o aviso leva: seguir -> perfil de quem seguiu; curtir/comentar ->
// o episódio. Sem episódio (não deveria acontecer), o perfil de quem agiu.
function targetRoute(notification) {
  if (notification.type !== 'follow' && notification.episode) {
    return { name: 'podcast-detail', params: { id: notification.episode.id } }
  }
  return { name: 'public-profile', params: { username: notification.Actor?.username } }
}

// Atualizar também acerta o sino, para os dois números baterem.
function refreshAll() {
  reload()
  notificationsStore.refresh()
}
</script>

<template>
  <div class="p-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Notificações</h1>
      <button type="button" class="btn btn-outline-primary btn-sm" :disabled="isLoading" @click="refreshAll">
        <i class="bi bi-arrow-clockwise"></i> Atualizar
      </button>
    </div>

    <div v-if="isLoading && notifications.length === 0" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="error && notifications.length === 0" class="alert alert-danger" role="alert">
      {{ error }}
      <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="reload">Tentar de novo</button>
    </div>

    <p v-else-if="isEmpty" class="text-secondary">
      Nenhuma notificação por enquanto. Quando alguém curtir ou comentar um episódio seu, ou começar a seguir
      você, o aviso aparece aqui. <router-link to="/upload">Publique um episódio</router-link>.
    </p>

    <template v-else>
      <ul class="notification-list">
        <li
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ 'is-unread': !notification.isRead }"
        >
          <img
            :src="getProfilePictureUrl(notification.Actor?.profilePicture)"
            :alt="`Foto de ${notification.Actor?.username}`"
            class="notification-avatar"
            loading="lazy"
          />

          <div class="notification-body">
            <router-link
              :to="targetRoute(notification)"
              class="notification-text"
              @click="markAsRead(notification)"
            >
              <span class="fw-semibold">@{{ notification.Actor?.username }}</span>
              {{ NOTIFICATION_TEXT[notification.type] }}<template v-if="notification.episode">:
                <span class="fst-italic">{{ notification.episode.title }}</span></template>
            </router-link>
            <div class="text-secondary small">{{ formatDateTime(notification.createdAt) }}</div>
          </div>

          <button
            v-if="!notification.isRead"
            type="button"
            class="btn btn-sm btn-outline-secondary"
            :disabled="busyIds.has(notification.id)"
            @click="markAsRead(notification)"
          >
            <i class="bi bi-check2"></i> Marcar como lida
          </button>
          <span v-else class="text-secondary small"><i class="bi bi-check2-all"></i> Lida</span>
        </li>
      </ul>

      <div v-if="error" class="alert alert-danger mt-3" role="alert">
        {{ error }}
        <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="loadMore">Tentar de novo</button>
      </div>

      <div v-if="hasMore" class="text-center mt-3">
        <button type="button" class="btn btn-outline-primary" :disabled="isLoading" @click="loadMore">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          Carregar mais notificações
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.notification-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-width: 720px;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--pw-border);
  border-radius: 8px;
}

.notification-item.is-unread {
  background-color: var(--pw-surface-alt);
  border-left: 3px solid var(--podwave-brand, #0d6efd);
}

.notification-item.is-unread .notification-text {
  font-weight: 600;
}

.notification-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--pw-border);
  flex-shrink: 0;
}

.notification-body {
  flex: 1;
  min-width: 0;
}

.notification-text {
  color: inherit;
  text-decoration: none;
  font-weight: 400;
}

.notification-text:hover {
  text-decoration: underline;
}
</style>
