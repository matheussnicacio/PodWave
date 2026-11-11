<script setup>
import { reactive, ref } from 'vue'
import { usePaginatedList } from '../../composables/usePaginatedList'
import { useDebouncedValue } from '../../composables/useDebouncedValue'
import { useToast } from '../../composables/useToast'
import { useAuth } from '../../composables/useAuth'
import { getAdminUsers, setUserBlocked } from '../../services/adminService'
import { SEARCH } from '../../config/constants'
import { getProfilePictureUrl } from '../../utils/media'
import ConfirmModal from '../../components/base/ConfirmModal.vue'

const toast = useToast()
const { user: currentUser } = useAuth()

// typedText muda a cada tecla; term só muda depois de SEARCH.DEBOUNCE_MS sem
// digitar. A lista observa o TERM (não o typedText): uma requisição por
// pausa, não por tecla.
const typedText = ref('')
const term = useDebouncedValue(typedText, SEARCH.DEBOUNCE_MS)

const { items: users, hasMore, isLoading, error, isEmpty, loadMore, reload } = usePaginatedList(
  (page, limit) => getAdminUsers(term.value.trim(), page, limit),
  undefined,
  { watch: term }
)

const busyIds = reactive(new Set())

// O usuário escolhido para bloquear: é ao mesmo tempo o INTERRUPTOR do modal
// (v-if="userToBlock") e o DADO dele (nome na mensagem).
const userToBlock = ref(null)

// Bloquear e desbloquear ESPERAM o servidor. A linha só muda com o
// isBlocked que a API devolveu. O modal só fecha no SUCESSO: se a API
// recusar (ou a rede cair), ele continua aberto e o toast do interceptor
// explica o motivo — dá para tentar de novo ou cancelar.
async function changeBlocked(user, isBlocked) {
  if (busyIds.has(user.id)) return
  busyIds.add(user.id)
  try {
    const response = await setUserBlocked(user.id, isBlocked)
    user.isBlocked = response.data.isBlocked
    toast.success(response.message)
    userToBlock.value = null
  } catch {
    // Vazio de propósito: o toast de erro é do interceptor.
  } finally {
    busyIds.delete(user.id)
  }
}
</script>

<template>
  <section aria-labelledby="users-title">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <h2 id="users-title" class="h5 mb-0">Usuários</h2>
      <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="isLoading" @click="reload">
        <i class="bi bi-arrow-clockwise"></i> Atualizar
      </button>
    </div>

    <!-- O campo fica FORA do bloco de carregando: se ele sumisse a cada busca,
         o input seria recriado e a pessoa perderia o foco no meio da digitação. -->
    <div class="mb-3">
      <label for="admin-users-search" class="visually-hidden">Buscar usuários</label>
      <input
        id="admin-users-search"
        v-model="typedText"
        type="search"
        class="form-control"
        placeholder="Buscar por usuário, nome ou e-mail"
        autocomplete="off"
      />
    </div>

    <div v-if="isLoading && users.length === 0" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="error && users.length === 0" class="alert alert-danger" role="alert">
      {{ error }}
      <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="reload">Tentar de novo</button>
    </div>

    <p v-else-if="isEmpty" class="text-secondary">Nenhum usuário encontrado.</p>

    <template v-else>
      <ul class="admin-list">
        <li v-for="user in users" :key="user.id" class="admin-row">
          <img :src="getProfilePictureUrl(user.profilePicture)" :alt="`Foto de ${user.username}`" class="admin-avatar" loading="lazy" />

          <div class="admin-row-body">
            <div class="d-flex flex-wrap align-items-center gap-2">
              <router-link :to="{ name: 'public-profile', params: { username: user.username } }" class="fw-semibold">
                @{{ user.username }}
              </router-link>
              <span v-if="user.isAdmin" class="badge text-bg-primary">Admin</span>
              <span v-if="user.isBlocked" class="badge text-bg-danger">Bloqueado</span>
            </div>
            <div class="small">{{ user.fullName }}</div>
            <div class="small text-secondary">{{ user.email }}</div>
            <div class="small text-secondary">
              {{ user.episodesCount }} episódio(s) · {{ user.followersCount }} seguidor(es)
            </div>
          </div>

          <span v-if="user.id === currentUser?.id" class="text-secondary small flex-shrink-0">Você</span>
          <span v-else-if="user.isAdmin" class="text-secondary small flex-shrink-0">Administrador</span>
          <button
            v-else-if="user.isBlocked"
            type="button"
            class="btn btn-sm btn-outline-success flex-shrink-0"
            :disabled="busyIds.has(user.id)"
            @click="changeBlocked(user, false)"
          >
            <template v-if="busyIds.has(user.id)">Salvando...</template>
            <template v-else><i class="bi bi-unlock"></i> Desbloquear</template>
          </button>
          <button
            v-else
            type="button"
            class="btn btn-sm btn-outline-danger flex-shrink-0"
            :disabled="busyIds.has(user.id)"
            @click="userToBlock = user"
          >
            <i class="bi bi-lock"></i> Bloquear
          </button>
        </li>
      </ul>

      <div v-if="error" class="alert alert-danger mt-3" role="alert">
        {{ error }}
        <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="loadMore">Tentar de novo</button>
      </div>

      <div v-if="hasMore" class="text-center mt-3">
        <button type="button" class="btn btn-outline-primary" :disabled="isLoading" @click="loadMore">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          Carregar mais
        </button>
      </div>
    </template>

    <ConfirmModal
      v-if="userToBlock"
      title="Bloquear usuário"
      :message="`Bloquear @${userToBlock.username}? A pessoa sai da conta na próxima ação e não consegue entrar de novo até ser desbloqueada. Os episódios e o perfil continuam visíveis.`"
      confirm-label="Bloquear"
      :busy="busyIds.has(userToBlock.id)"
      @confirm="changeBlocked(userToBlock, true)"
      @close="userToBlock = null"
    />
  </section>
</template>
