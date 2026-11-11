<script setup>
// Checagem de alcançabilidade (Atividade 13, Seção 9) — caminhos de clique:
//  - Minhas Playlists: item "Minhas Playlists" no menu do avatar (Navbar) e na Sidebar
//  - Criar / excluir: botão "Nova playlist" (modal) e "Excluir" em cada cartão (confirmação)
//  - Detalhe da playlist: clique no cartão (link esticado)
//  - Salvar um episódio: botão "Salvar" no detalhe do episódio (visitante -> login -> volta)
//  - Remover da playlist: botão em cada card, no detalhe da playlist (só a dona)
//  - Busca: barra da Navbar (Enter) e item "Explorar" da Sidebar
import { ref } from 'vue'
import { getMyPlaylists, deletePlaylist } from '../../services/playlistService'
import { useAsyncData } from '../../composables/useAsyncData'
import { useToast } from '../../composables/useToast'
import BaseModal from '../../components/base/BaseModal.vue'
import BaseButton from '../../components/base/BaseButton.vue'
import CreatePlaylistModal from '../../components/playlists/CreatePlaylistModal.vue'

const toast = useToast()

const { data: playlists, error, isLoading, refresh } = useAsyncData(() => getMyPlaylists(), {
  initialData: [],
})

// Dois controles de modal independentes: criar e excluir.
const isCreating = ref(false)
const playlistToDelete = ref(null)
const isDeleting = ref(false)

// A nova playlist entra no TOPO (a lista é da mais nova para a mais antiga),
// num ARRAY NOVO — sem mexer no array antigo por fora do Vue.
function onCreated(playlist) {
  playlists.value = [playlist, ...playlists.value]
  isCreating.value = false
  toast.success('Playlist criada.')
}

function askDelete(playlist) {
  playlistToDelete.value = playlist
}

function cancelDelete() {
  if (isDeleting.value) return
  playlistToDelete.value = null
}

// Exclusão é PESSIMISTA: espera a API. Se falhar, o toast vem do interceptor
// e o modal continua aberto para tentar de novo.
async function confirmDelete() {
  if (!playlistToDelete.value || isDeleting.value) return
  isDeleting.value = true
  try {
    const { id } = playlistToDelete.value
    await deletePlaylist(id)
    playlists.value = playlists.value.filter((playlist) => playlist.id !== id)
    playlistToDelete.value = null
    toast.success('Playlist excluída.')
  } catch {
    // O toast de erro já foi mostrado pelo interceptor.
  } finally {
    isDeleting.value = false
  }
}

function plural(count) {
  return count === 1 ? '1 episódio' : `${count} episódios`
}
</script>

<template>
  <div class="p-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Minhas Playlists</h1>
      <button type="button" class="btn btn-primary btn-sm" @click="isCreating = true">
        <i class="bi bi-plus-lg"></i> Nova playlist
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
      <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="refresh">Tentar de novo</button>
    </div>

    <div v-else-if="playlists.length === 0" class="text-secondary">
      Você ainda não tem playlists. Clique em <strong>Nova playlist</strong> para criar a primeira e,
      depois, use o botão <strong>Salvar</strong> na página de qualquer episódio.
    </div>

    <div v-else class="playlist-grid">
      <!-- position-relative: âncora do link esticado (stretched-link cobre o
           cartão inteiro com um ::after). O botão "Excluir" fica POR CIMA
           desse ::after com position-relative + z-index, então o clique nele
           não navega. -->
      <article v-for="playlist in playlists" :key="playlist.id" class="playlist-card position-relative">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <h2 class="h6 mb-1">
            <router-link
              :to="{ name: 'playlist-detail', params: { id: playlist.id } }"
              class="stretched-link text-decoration-none"
            >{{ playlist.title }}</router-link>
          </h2>
          <span class="badge" :class="playlist.isPublic ? 'text-bg-success' : 'text-bg-secondary'">
            <i class="bi" :class="playlist.isPublic ? 'bi-globe' : 'bi-lock-fill'"></i>
            {{ playlist.isPublic ? 'Pública' : 'Privada' }}
          </span>
        </div>
        <p v-if="playlist.description" class="text-secondary small mb-2 playlist-card-description">
          {{ playlist.description }}
        </p>
        <div class="d-flex justify-content-between align-items-center mt-auto">
          <span class="text-secondary small"><i class="bi bi-collection-play"></i> {{ plural(playlist.episodesCount) }}</span>
          <button
            type="button"
            class="btn btn-outline-danger btn-sm position-relative playlist-card-action"
            @click="askDelete(playlist)"
          >
            <i class="bi bi-trash"></i> Excluir
          </button>
        </div>
      </article>
    </div>

    <CreatePlaylistModal :open="isCreating" @close="isCreating = false" @created="onCreated" />

    <BaseModal :open="playlistToDelete !== null" title="Excluir playlist" :busy="isDeleting" @close="cancelDelete">
      <p class="mb-2">
        Tem certeza que quer excluir <strong>{{ playlistToDelete?.title }}</strong>?
      </p>
      <p class="text-secondary small mb-0">Os episódios continuam existindo; só a playlist é apagada.</p>

      <template #footer>
        <BaseButton variant="outline-secondary" :block="false" :disabled="isDeleting" @click="cancelDelete">
          Cancelar
        </BaseButton>
        <BaseButton variant="danger" :block="false" :loading="isDeleting" @click="confirmDelete">
          Excluir
          <template #loading>Excluindo...</template>
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.playlist-card {
  display: flex;
  flex-direction: column;
  min-height: 130px;
  padding: 1rem;
  border: 1px solid var(--pw-border);
  border-radius: 12px;
  background-color: var(--pw-surface);
}

.playlist-card:focus-within {
  outline: 2px solid var(--podwave-brand, #0d6efd);
  outline-offset: 2px;
}

.playlist-card-description {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.playlist-card-action {
  z-index: 2;
}
</style>
