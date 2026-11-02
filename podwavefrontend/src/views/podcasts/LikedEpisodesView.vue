<script setup>
import { getLikedEpisodes } from '../../services/likeService'
import { useAsyncData } from '../../composables/useAsyncData'
import EpisodeCard from '../../components/episodes/EpisodeCard.vue'

const { data: episodes, error, isLoading, refresh } = useAsyncData(() => getLikedEpisodes(), {
  initialData: [],
})
</script>

<template>
  <div class="p-4">
    <h1 class="h3 mb-4">Episódios curtidos</h1>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
      <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="refresh">Tentar de novo</button>
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
