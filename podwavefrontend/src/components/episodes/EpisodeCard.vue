<script setup>
import { computed } from 'vue'
import { getEpisodeCoverUrl } from '../../utils/media'

// Card reutilizável de um episódio na grade do Feed. Recebe o episódio já
// no formato devolvido por GET /api/feed (com o autor populado em
// episode.author) e não faz nenhuma chamada de rede: só exibe.
// O card inteiro é um <router-link> para o detalhe — navegação client-side,
// sem recarregar a página.
const props = defineProps({
  episode: { type: Object, required: true },
})

const coverUrl = computed(() => getEpisodeCoverUrl(props.episode.cover))

const authorName = computed(
  () => props.episode.author?.fullName || props.episode.author?.username || 'Autor desconhecido'
)
</script>

<template>
  <router-link
    :to="{ name: 'podcast-detail', params: { id: episode.id } }"
    class="episode-card"
  >
    <img
      :src="coverUrl"
      :alt="`Capa do episódio ${episode.title}`"
      class="episode-card-cover"
      loading="lazy"
    />
    <div class="episode-card-body">
      <h3 class="episode-card-title">{{ episode.title }}</h3>
      <p class="episode-card-meta">{{ authorName }}</p>
      <p class="episode-card-meta">
        <i class="bi bi-headphones"></i> {{ episode.views }}
      </p>
    </div>
  </router-link>
</template>
