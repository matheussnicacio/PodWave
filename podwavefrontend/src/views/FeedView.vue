<script setup>
import { onMounted, ref } from 'vue'
import { getFeed } from '../services/episodeService'
import EpisodeCard from '../components/episodes/EpisodeCard.vue'
import BaseButton from '../components/base/BaseButton.vue'

// Quantos itens cada página pede. A API devolve um array; se vier menos do
// que PAGE_SIZE, sabemos que acabaram os itens e escondemos o botão.
const PAGE_SIZE = 8

const episodes = ref([])
const page = ref(0) // última página já carregada (0 = nenhuma)
const hasMore = ref(true)
const isLoading = ref(false)
const errorMessage = ref('')

async function loadMore() {
  if (isLoading.value) return
  isLoading.value = true
  errorMessage.value = ''

  try {
    const nextPage = page.value + 1
    const response = await getFeed(nextPage, PAGE_SIZE)
    const items = response.data

    // "Carregar mais" ACRESCENTA a página nova à lista existente (push), em
    // vez de substituí-la: o usuário não perde o que já viu.
    episodes.value.push(...items)
    page.value = nextPage
    hasMore.value = items.length === PAGE_SIZE
  } catch (err) {
    errorMessage.value = err.message || 'Não foi possível carregar o feed.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadMore)
</script>

<template>
  <div class="p-4">
    <h1 class="h3 mb-4">Feed de Podcasts</h1>

    <div v-if="errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
    </div>

    <p v-if="!isLoading && !errorMessage && episodes.length === 0" class="text-secondary">
      Nenhum episódio publicado ainda.
    </p>

    <div v-if="episodes.length > 0" class="episode-grid">
      <EpisodeCard v-for="episode in episodes" :key="episode.id" :episode="episode" />
    </div>

    <div v-if="hasMore && (episodes.length > 0 || isLoading)" class="text-center mt-4">
      <BaseButton
        variant="outline-primary"
        :block="false"
        :loading="isLoading"
        @click="loadMore"
      >
        Carregar mais
        <template #loading>Carregando...</template>
      </BaseButton>
    </div>

    <p v-else-if="episodes.length > 0" class="text-center text-secondary mt-4">
      Você chegou ao fim do feed.
    </p>
  </div>
</template>
