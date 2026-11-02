<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getEpisodeById } from '../../services/episodeService'
import { useAsyncData } from '../../composables/useAsyncData'
import { getEpisodeAudioUrl, getEpisodeCoverUrl, getProfilePictureUrl } from '../../utils/media'
import { formatCount } from '../../utils/format'
import LikeButton from '../../components/episodes/LikeButton.vue'
import CommentSection from '../../components/episodes/CommentSection.vue'

const route = useRoute()

// useAsyncData: carrega ao abrir e recarrega se o :id mudar (watch). A função
// () => getEpisodeById(...) é passada, NÃO a chamada: quem decide quando
// chamar é o composable. lastCallId descarta respostas atrasadas de um id antigo.
const { data, error, isLoading } = useAsyncData(
  () => getEpisodeById(route.params.id),
  { watch: () => route.params.id }
)

// isOwner e isLiked vêm da API junto do episódio. isOwner só decide se o botão
// "Editar" aparece — esconder o botão NÃO é segurança: a API recusa (403).
const episode = computed(() => {
  if (!data.value) return null
  const { isOwner, isLiked, ...rest } = data.value
  return rest
})
const isOwner = computed(() => data.value?.isOwner ?? false)
const isLiked = computed(() => data.value?.isLiked ?? false)

// O contador de comentários sobe quando a CommentSection avisa que um
// comentário foi criado; por isso é um ref próprio, iniciado pelo episódio.
const commentsCount = ref(0)
watch(episode, (value) => { commentsCount.value = value?.commentsCount ?? 0 })
</script>

<template>
  <div class="p-4">
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
      <router-link to="/feed" class="alert-link ms-2">Voltar ao feed</router-link>
    </div>

    <div v-else-if="episode" class="row g-4">
      <div class="col-12 col-md-4">
        <img
          :src="getEpisodeCoverUrl(episode.cover)"
          :alt="`Capa do episódio ${episode.title}`"
          class="episode-detail-cover"
        />
      </div>

      <div class="col-12 col-md-8">
        <h1 class="h3">{{ episode.title }}</h1>

        <p class="text-secondary mb-2">
          <router-link
            v-if="episode.author"
            :to="{ name: 'public-profile', params: { username: episode.author.username } }"
            class="text-decoration-none"
          >
            <img
              :src="getProfilePictureUrl(episode.author.profilePicture)"
              alt=""
              width="28"
              height="28"
              class="rounded-circle me-2"
            />{{ episode.author.fullName || episode.author.username }}
          </router-link>
          <span class="ms-3"><i class="bi bi-headphones"></i> {{ formatCount(episode.views) }} reproduções</span>
          <span class="ms-3"><i class="bi bi-chat"></i> {{ formatCount(commentsCount) }} comentários</span>
        </p>

        <LikeButton
          class="mb-3"
          :episode-id="episode.id"
          :initial-liked="isLiked"
          :initial-count="episode.likesCount ?? 0"
        />

        <p v-if="episode.description">{{ episode.description }}</p>

        <router-link
          v-if="isOwner"
          :to="{ name: 'podcast-edit', params: { id: episode.id } }"
          class="btn btn-outline-primary btn-sm mb-2"
        >
          <i class="bi bi-pencil"></i> Editar
        </router-link>

        <!-- src aponta para o arquivo ESTÁTICO (/uploads/...), nunca para a
             rota /api/episodes/:id/stream: <audio> não consegue enviar o
             header Authorization, então a rota protegida devolveria 401.
             O express.static já responde Range (206), então dá para
             arrastar a barra de progresso livremente. -->
        <audio
          class="episode-player"
          controls
          preload="metadata"
          :src="getEpisodeAudioUrl(episode.audio)"
        >
          Seu navegador não suporta o elemento de áudio.
        </audio>
      </div>

      <div class="col-12">
        <CommentSection :episode-id="episode.id" @created="commentsCount++" />
      </div>
    </div>
  </div>
</template>
