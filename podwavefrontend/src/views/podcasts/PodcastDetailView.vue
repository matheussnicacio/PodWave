<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getEpisodeById } from '../../services/episodeService'
import { getEpisodeAudioUrl, getEpisodeCoverUrl, getProfilePictureUrl } from '../../utils/media'

const route = useRoute()

const episode = ref(null)
// isOwner vem da API (true se o usuário logado é o autor). Fica guardado
// no estado desde já, mesmo sem uso visual — os botões de editar/excluir
// que dependem dele chegam na Aula 09.
const isOwner = ref(false)
const isLoading = ref(true)
const errorMessage = ref('')

async function loadEpisode(id) {
  isLoading.value = true
  errorMessage.value = ''
  episode.value = null

  try {
    const response = await getEpisodeById(id)
    const { isOwner: owner, ...data } = response.data
    episode.value = data
    isOwner.value = owner
  } catch (err) {
    // id inexistente (404), rede fora do ar etc.: mostra a mensagem da API
    // em vez de deixar a tela quebrada/em branco.
    errorMessage.value = err.message || 'Não foi possível carregar o episódio.'
  } finally {
    isLoading.value = false
  }
}

// immediate: carrega ao abrir a tela; e recarrega se o :id da URL mudar sem
// a tela ser recriada (navegar de um episódio para outro).
watch(() => route.params.id, (id) => loadEpisode(id), { immediate: true })
</script>

<template>
  <div class="p-4">
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
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
            :to="{ name: 'public-profile', params: { id: episode.author.username } }"
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
          <span class="ms-3"><i class="bi bi-headphones"></i> {{ episode.views }} reproduções</span>
        </p>

        <p v-if="episode.description">{{ episode.description }}</p>

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
    </div>
  </div>
</template>
