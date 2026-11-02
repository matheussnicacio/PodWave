<script setup>
import { getFeed } from '../services/episodeService'
import { usePaginatedList } from '../composables/usePaginatedList'
import EpisodeCard from '../components/episodes/EpisodeCard.vue'
import BaseButton from '../components/base/BaseButton.vue'

// usePaginatedList cuida de items/página/hasMore/isLoading/error (e de
// carregar a primeira página). Erro de leitura fica aqui na tela.
const { items: episodes, hasMore, isLoading, error, isEmpty, loadMore } = usePaginatedList(getFeed)
</script>

<template>
  <div class="p-4">
    <h1 class="h3 mb-4">Feed de Podcasts</h1>

    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <p v-if="isEmpty" class="text-secondary">
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
