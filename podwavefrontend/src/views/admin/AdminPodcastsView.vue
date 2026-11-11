<script setup>
import { ref } from 'vue'
import { usePaginatedList } from '../../composables/usePaginatedList'
import { useDebouncedValue } from '../../composables/useDebouncedValue'
import { useToast } from '../../composables/useToast'
import { getAdminEpisodes, deleteAdminEpisode } from '../../services/adminService'
import { SEARCH } from '../../config/constants'
import { getEpisodeCoverUrl } from '../../utils/media'
import { formatDateTime } from '../../utils/format'
import ConfirmModal from '../../components/base/ConfirmModal.vue'

const toast = useToast()

const typedText = ref('')
const term = useDebouncedValue(typedText, SEARCH.DEBOUNCE_MS)

const { items: episodes, hasMore, isLoading, error, isEmpty, loadMore, reload } = usePaginatedList(
  (page, limit) => getAdminEpisodes(term.value.trim(), page, limit),
  undefined,
  { watch: term }
)

// O episódio escolhido: interruptor E dado do modal (como o userToBlock).
const episodeToDelete = ref(null)
const isDeleting = ref(false)

function pendingLabel(count) {
  return count === 1 ? '1 denúncia pendente' : `${count} denúncias pendentes`
}

// Exclusão ESPERA o servidor: a linha só sai da lista depois do 200. Se
// falhar, o modal continua aberto e o toast do interceptor explica.
async function confirmDelete() {
  if (!episodeToDelete.value || isDeleting.value) return
  isDeleting.value = true
  const target = episodeToDelete.value
  try {
    const response = await deleteAdminEpisode(target.id)
    episodes.value = episodes.value.filter((episode) => episode.id !== target.id)
    toast.success(response.message)
    episodeToDelete.value = null
  } catch {
    // Vazio de propósito: o toast de erro é do interceptor.
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <section aria-labelledby="episodes-title">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <h2 id="episodes-title" class="h5 mb-0">Episódios</h2>
      <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="isLoading" @click="reload">
        <i class="bi bi-arrow-clockwise"></i> Atualizar
      </button>
    </div>

    <div class="mb-3">
      <label for="admin-episodes-search" class="visually-hidden">Buscar episódios</label>
      <input
        id="admin-episodes-search"
        v-model="typedText"
        type="search"
        class="form-control"
        placeholder="Buscar pelo título"
        autocomplete="off"
      />
    </div>

    <div v-if="isLoading && episodes.length === 0" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="error && episodes.length === 0" class="alert alert-danger" role="alert">
      {{ error }}
      <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="reload">Tentar de novo</button>
    </div>

    <p v-else-if="isEmpty" class="text-secondary">Nenhum episódio encontrado.</p>

    <template v-else>
      <ul class="admin-list">
        <li v-for="episode in episodes" :key="episode.id" class="admin-row">
          <router-link :to="{ name: 'podcast-detail', params: { id: episode.id } }" class="flex-shrink-0">
            <img :src="getEpisodeCoverUrl(episode.cover)" :alt="`Capa de ${episode.title}`" class="admin-thumb" loading="lazy" />
          </router-link>

          <div class="admin-row-body">
            <router-link :to="{ name: 'podcast-detail', params: { id: episode.id } }" class="fw-semibold">
              {{ episode.title }}
            </router-link>
            <div class="small text-secondary">
              de
              <router-link :to="{ name: 'public-profile', params: { username: episode.author?.username } }">
                @{{ episode.author?.username }}
              </router-link>
              · {{ formatDateTime(episode.createdAt) }}
            </div>
            <span v-if="episode.pendingReportsCount > 0" class="badge text-bg-warning mt-1">
              <i class="bi bi-flag-fill"></i> {{ pendingLabel(episode.pendingReportsCount) }}
            </span>
          </div>

          <button type="button" class="btn btn-sm btn-outline-danger flex-shrink-0" @click="episodeToDelete = episode">
            <i class="bi bi-trash"></i> Excluir
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
      v-if="episodeToDelete"
      title="Excluir episódio"
      :message="`Excluir “${episodeToDelete.title}” de @${episodeToDelete.author?.username}?\n\nSerão apagados: o áudio e a capa, as curtidas, os comentários, as denúncias, as notificações e o episódio das playlists.\n\nEssa ação não pode ser desfeita.`"
      confirm-label="Excluir episódio"
      :busy="isDeleting"
      @confirm="confirmDelete"
      @close="episodeToDelete = null"
    />
  </section>
</template>
