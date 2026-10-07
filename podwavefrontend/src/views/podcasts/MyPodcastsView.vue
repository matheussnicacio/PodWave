<script setup>
import { onMounted, ref } from 'vue'
import { getMyEpisodes, deleteEpisode } from '../../services/episodeService'
import EpisodeCard from '../../components/episodes/EpisodeCard.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import BaseButton from '../../components/base/BaseButton.vue'

const episodes = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

// Um ÚNICO modal para a tela toda, fora da grade/dos cards: o card que a
// pessoa clicou fica guardado em episodeToDelete (null = modal fechado).
// Se cada card tivesse seu próprio modal, ele herdaria o transform do :hover
// do card e o position: fixed deixaria de ser relativo à janela.
const episodeToDelete = ref(null)
const isDeleting = ref(false)
const deleteError = ref('')

async function loadEpisodes() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await getMyEpisodes()
    episodes.value = response.data
  } catch (err) {
    errorMessage.value = err.message || 'Não foi possível carregar seus episódios.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadEpisodes)

function askDelete(episode) {
  deleteError.value = ''
  episodeToDelete.value = episode
}

function cancelDelete() {
  if (isDeleting.value) return
  episodeToDelete.value = null
}

async function confirmDelete() {
  if (!episodeToDelete.value || isDeleting.value) return
  isDeleting.value = true
  deleteError.value = ''

  try {
    const { id } = episodeToDelete.value
    await deleteEpisode(id)
    // Remoção LOCAL: o item some da lista sem recarregar e sem nova ida à API.
    episodes.value = episodes.value.filter((episode) => episode.id !== id)
    episodeToDelete.value = null
  } catch (err) {
    deleteError.value = err.message || 'Não foi possível excluir o episódio.'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="p-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Meus Podcasts</h1>
      <router-link to="/upload" class="btn btn-primary btn-sm">
        <i class="bi bi-upload"></i> Publicar episódio
      </router-link>
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>

    <div v-else-if="episodes.length === 0" class="text-secondary">
      Você ainda não publicou nenhum episódio.
      <router-link to="/upload">Publique o primeiro</router-link>.
    </div>

    <div v-else class="episode-grid">
      <EpisodeCard v-for="episode in episodes" :key="episode.id" :episode="episode" :show-author="false">
        <template #actions>
          <router-link
            :to="{ name: 'podcast-edit', params: { id: episode.id } }"
            class="btn btn-outline-primary btn-sm"
          >
            <i class="bi bi-pencil"></i> Editar
          </router-link>
          <button type="button" class="btn btn-outline-danger btn-sm" @click="askDelete(episode)">
            <i class="bi bi-trash"></i> Excluir
          </button>
        </template>
      </EpisodeCard>
    </div>

    <BaseModal :open="episodeToDelete !== null" title="Excluir episódio" :busy="isDeleting" @close="cancelDelete">
      <p class="mb-2">
        Tem certeza que quer excluir <strong>{{ episodeToDelete?.title }}</strong>?
      </p>
      <p class="text-secondary small mb-0">
        O áudio e a capa serão apagados e essa ação não pode ser desfeita.
      </p>
      <div v-if="deleteError" class="alert alert-danger py-2 mt-3 mb-0" role="alert">{{ deleteError }}</div>

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
