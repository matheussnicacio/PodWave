<script setup>
import { onMounted, ref } from 'vue'
import { getLikedEpisodes } from '../../services/likeService'
import EpisodeCard from '../../components/episodes/EpisodeCard.vue'

const episodes = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

// Recarrega a cada visita à tela: descurtir no Detalhe e voltar aqui mostra a
// lista já sem o item (a view é recriada ao navegar).
async function loadEpisodes() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await getLikedEpisodes()
    episodes.value = response.data
  } catch (err) {
    errorMessage.value = err.message || 'Não foi possível carregar os episódios curtidos.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadEpisodes)
</script>

<template>
  <div class="p-4">
    <h1 class="h3 mb-4">Episódios curtidos</h1>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
      <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="loadEpisodes">Tentar de novo</button>
    </div>

    <div v-else-if="episodes.length === 0" class="text-secondary">
      Você ainda não curtiu nenhum episódio.
      <router-link to="/feed">Explore o feed</router-link>.
    </div>

    <div v-else class="episode-grid">
      <EpisodeCard v-for="episode in episodes" :key="episode.id" :episode="episode" />
    </div>
  </div>
</template>
