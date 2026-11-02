<script setup>
import { getFollowingEpisodes } from '../services/followService'
import { usePaginatedList } from '../composables/usePaginatedList'
import EpisodeCard from '../components/episodes/EpisodeCard.vue'
import BaseButton from '../components/base/BaseButton.vue'

const { items: episodes, hasMore, isLoading, error, isEmpty, loadMore } = usePaginatedList(getFollowingEpisodes)
</script>

<template>
  <div class="p-4">
    <h1 class="h3 mb-4">Seguindo</h1>

    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
      <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="loadMore">Tentar de novo</button>
    </div>

    <!-- Estado vazio: não segue ninguém, ou quem segue ainda não publicou. -->
    <p v-if="isEmpty" class="text-secondary">
      Nada por aqui ainda: você não segue ninguém ou as pessoas que você segue ainda não publicaram.
      <router-link to="/feed">Explore o feed</router-link> para encontrar pessoas para seguir.
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
      Você chegou ao fim do feed de quem você segue.
    </p>
  </div>
</template>
