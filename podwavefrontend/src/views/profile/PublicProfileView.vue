<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getPublicProfile } from '../../services/authService'
import { getProfilePictureUrl } from '../../utils/media'
import { useAuth } from '../../composables/useAuth'
import EpisodeCard from '../../components/episodes/EpisodeCard.vue'

const route = useRoute()
const { isAuthenticated } = useAuth()

const profile = ref(null)
const episodes = ref([])
// isOwner vem da API (true se quem pede é a dona/o dono do perfil). Quem
// decide é o servidor, comparando o token com o id do perfil — o front só
// usa o valor para escolher qual botão mostrar.
const isOwner = ref(false)
const isLoading = ref(true)
const errorMessage = ref('')

// Protege contra resposta atrasada: se a pessoa navega de um perfil para
// outro rápido, só a ÚLTIMA requisição pode escrever no estado.
let latestRequest = 0

async function loadProfile(username) {
  const requestId = ++latestRequest
  isLoading.value = true
  errorMessage.value = ''
  profile.value = null
  episodes.value = []
  isOwner.value = false

  try {
    const response = await getPublicProfile(username)
    if (requestId !== latestRequest) return
    const { isOwner: owner, episodes: items = [], ...data } = response.data
    profile.value = data
    episodes.value = items
    isOwner.value = owner
  } catch (err) {
    if (requestId !== latestRequest) return
    errorMessage.value = err.message || 'Não foi possível carregar o perfil.'
  } finally {
    if (requestId === latestRequest) isLoading.value = false
  }
}

// immediate: carrega ao abrir; e recarrega quando só o :username muda (de um
// perfil para outro o Vue Router REAPROVEITA o componente — sem este watch a
// tela ficaria presa no perfil anterior).
watch(() => route.params.username, (username) => loadProfile(username), { immediate: true })
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

    <template v-else-if="profile">
      <section class="d-flex flex-column flex-md-row align-items-center gap-4 mb-4">
        <img
          :src="getProfilePictureUrl(profile.profilePicture)"
          :alt="`Foto de ${profile.username}`"
          class="profile-avatar"
        />

        <div class="text-center text-md-start">
          <h1 class="h3 mb-0">{{ profile.fullName || profile.username }}</h1>
          <p class="text-secondary mb-2">@{{ profile.username }}</p>
          <p v-if="profile.bio" class="mb-2">{{ profile.bio }}</p>
          <p class="text-secondary small mb-3">
            <strong>{{ profile.episodesCount }}</strong> episódios ·
            <strong>{{ profile.followersCount }}</strong> seguidores ·
            <strong>{{ profile.followingCount }}</strong> seguindo
          </p>

          <!-- Três casos: dono / logado (outra pessoa) / visitante.
               Esconder o botão não é segurança: a API é quem recusa. -->
          <router-link v-if="isOwner" :to="{ name: 'my-profile' }" class="btn btn-outline-primary">
            <i class="bi bi-pencil-square"></i> Editar Perfil
          </router-link>
          <button v-else-if="isAuthenticated" type="button" class="btn btn-primary">
            <i class="bi bi-person-plus"></i> Seguir
          </button>
        </div>
      </section>

      <h2 class="h5 mb-3">Episódios</h2>

      <p v-if="episodes.length === 0" class="text-secondary">Nenhum episódio publicado ainda.</p>

      <div v-else class="episode-grid">
        <EpisodeCard
          v-for="episode in episodes"
          :key="episode.id"
          :episode="episode"
          :show-author="false"
        />
      </div>
    </template>
  </div>
</template>
