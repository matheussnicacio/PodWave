<script setup>
import { onMounted, ref } from 'vue'
import { getFollowingEpisodes } from '../services/followService'
import EpisodeCard from '../components/episodes/EpisodeCard.vue'
import BaseButton from '../components/base/BaseButton.vue'

// Checagem de alcançabilidade (ADR-012): esta tela é alcançada em UM clique
// pelo item "Seguindo" da Sidebar (TheSidebar.vue -> to="/following"), que é
// o mesmo path da rota 'following-feed' (router/index.js, requiresAuth).
//
// Mesma estrutura do FeedView (Atividade 08): page / hasMore / "Carregar
// mais", só que a fonte é GET /api/following-episodes.
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
    const response = await getFollowingEpisodes(nextPage, PAGE_SIZE)
    const items = response.data

    // Acrescenta (push) em vez de substituir: quem já viu não perde o que viu.
    episodes.value.push(...items)
    page.value = nextPage
    hasMore.value = items.length === PAGE_SIZE
  } catch (err) {
    errorMessage.value = err.message || 'Não foi possível carregar o feed de quem você segue.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadMore)
</script>

<template>
  <div class="p-4">
    <h1 class="h3 mb-4">Seguindo</h1>

    <div v-if="errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
      <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="loadMore">Tentar de novo</button>
    </div>

    <!-- Estado vazio: não segue ninguém, ou quem segue ainda não publicou. -->
    <p v-if="!isLoading && !errorMessage && episodes.length === 0" class="text-secondary">
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
