<script setup>
import { ref } from 'vue'
import { getMyEpisodes, deleteEpisode } from '../../services/episodeService'
import { useAsyncData } from '../../composables/useAsyncData'
import { useToast } from '../../composables/useToast'
import EpisodeCard from '../../components/episodes/EpisodeCard.vue'
import BaseModal from '../../components/base/BaseModal.vue'
import BaseButton from '../../components/base/BaseButton.vue'

const toast = useToast()

const { data: episodes, error, isLoading } = useAsyncData(() => getMyEpisodes(), { initialData: [] })

// Exclusão = AÇÃO (não é leitura nem formulário): se falhar, quem avisa é o
// toast do interceptor (aparece na frente do modal); o modal continua aberto
// para tentar de novo. Por isso não há mais mensagem de erro dentro do modal.
const episodeToDelete = ref(null)
const isDeleting = ref(false)

function askDelete(episode) {
  episodeToDelete.value = episode
}

function cancelDelete() {
  if (isDeleting.value) return
  episodeToDelete.value = null
}

async function confirmDelete() {
  if (!episodeToDelete.value || isDeleting.value) return
  isDeleting.value = true

  try {
    const { id } = episodeToDelete.value
    await deleteEpisode(id)
    episodes.value = episodes.value.filter((episode) => episode.id !== id)
    episodeToDelete.value = null
    toast.success('Episódio excluído com sucesso.')
  } catch {
    // O toast de erro já foi mostrado pelo interceptor.
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

    <div v-else-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

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
