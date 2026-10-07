<script setup>
import { computed } from 'vue'
import { getEpisodeCoverUrl } from '../../utils/media'

// Card reutilizável de um episódio. Recebe o episódio já no formato devolvido
// pela API e não faz nenhuma chamada de rede: só exibe.
//
// Refatorado na Aula 09: antes o card INTEIRO era um <router-link> (<a>).
// Isso impede colocar qualquer outro elemento clicável dentro dele — um link
// para o perfil do autor ou um botão de Excluir virariam <a>/<button>
// aninhados dentro de outro <a>, o que é HTML inválido e faz o clique "vazar"
// para a navegação do card. Agora o card é um <article> e só a capa e o
// título são links para o detalhe; o autor é um link próprio e as ações ficam
// no slot `actions`.
const props = defineProps({
  episode: { type: Object, required: true },
  // O autor é opcional: no Perfil Público e em Meus Podcasts todos os cards
  // são da mesma pessoa, então repetir o autor em cada um seria ruído.
  showAuthor: { type: Boolean, default: true },
})

const coverUrl = computed(() => getEpisodeCoverUrl(props.episode.cover))
const detailRoute = computed(() => ({ name: 'podcast-detail', params: { id: props.episode.id } }))

const author = computed(() => props.episode.author || null)
const authorName = computed(() => author.value?.fullName || author.value?.username || 'Autor desconhecido')
</script>

<template>
  <article class="episode-card">
    <router-link :to="detailRoute" class="episode-card-link">
      <img
        :src="coverUrl"
        :alt="`Capa do episódio ${episode.title}`"
        class="episode-card-cover"
        loading="lazy"
      />
    </router-link>

    <div class="episode-card-body">
      <h3 class="episode-card-title">
        <router-link :to="detailRoute" class="episode-card-link">{{ episode.title }}</router-link>
      </h3>

      <p v-if="showAuthor && author" class="episode-card-meta">
        <router-link
          :to="{ name: 'public-profile', params: { username: author.username } }"
          class="episode-card-author"
        >{{ authorName }}</router-link>
      </p>

      <p class="episode-card-meta">
        <i class="bi bi-headphones"></i> {{ episode.views }}
      </p>

      <div v-if="$slots.actions" class="episode-card-actions">
        <slot name="actions" />
      </div>
    </div>
  </article>
</template>
