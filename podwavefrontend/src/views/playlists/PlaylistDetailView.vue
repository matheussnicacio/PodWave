<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getPlaylistById, removeEpisodeFromPlaylist } from '../../services/playlistService'
import { useAsyncData } from '../../composables/useAsyncData'
import { useToast } from '../../composables/useToast'
import { getProfilePictureUrl } from '../../utils/media'
import EpisodeCard from '../../components/episodes/EpisodeCard.vue'

const route = useRoute()
const toast = useToast()

// Leitura: 403 (privada de outra pessoa) e 404 (não existe) aparecem NO
// LUGAR do conteúdo, sem toast (é um GET: o interceptor não avisa leituras).
// Precisamos do STATUS para escolher a mensagem, então guardamos o erro
// inteiro aqui (o useAsyncData só guarda a mensagem).
const errorStatus = ref(null)

const { data: playlist, error, isLoading } = useAsyncData(
  async () => {
    errorStatus.value = null
    try {
      return await getPlaylistById(route.params.id)
    } catch (err) {
      errorStatus.value = err.status
      throw err
    }
  },
  { watch: () => route.params.id }
)

const isOwner = computed(() => playlist.value?.isOwner ?? false)
const ownerName = computed(() => {
  const owner = playlist.value?.owner
  return owner ? owner.fullName || owner.username : ''
})

const errorTitle = computed(() => {
  if (errorStatus.value === 403) return 'Esta playlist é privada.'
  if (errorStatus.value === 404) return 'Playlist não encontrada.'
  return error.value
})

// "Remover da playlist" é PESSIMISTA: só tira o card depois que a API
// confirmar (e usa o contador que ela devolveu). Se falhar, o card fica e o
// toast vem do interceptor. Um set de ids em andamento evita dois cliques.
const removing = ref(new Set())

async function removeEpisode(episode) {
  if (removing.value.has(episode.id)) return
  removing.value = new Set(removing.value).add(episode.id)
  try {
    const response = await removeEpisodeFromPlaylist(playlist.value.id, episode.id)
    playlist.value.episodes = playlist.value.episodes.filter((item) => item.id !== episode.id)
    playlist.value.episodesCount = response.data.episodesCount
    toast.success('Episódio removido da playlist.')
  } catch {
    // O toast de erro já foi mostrado pelo interceptor.
  } finally {
    const next = new Set(removing.value)
    next.delete(episode.id)
    removing.value = next
  }
}

function plural(count) {
  return count === 1 ? '1 episódio' : `${count} episódios`
}
</script>

<template>
  <div class="p-4">
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="error" class="text-center py-5">
      <i class="bi display-6 text-secondary" :class="errorStatus === 403 ? 'bi-lock' : 'bi-question-circle'"></i>
      <h1 class="h4 mt-3">{{ errorTitle }}</h1>
      <p v-if="errorStatus === 403" class="text-secondary">Só a dona desta playlist pode ver o conteúdo dela.</p>
      <router-link to="/feed" class="btn btn-outline-primary btn-sm mt-2">Voltar ao feed</router-link>
    </div>

    <template v-else-if="playlist">
      <div class="mb-4">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <h1 class="h3 mb-0">{{ playlist.title }}</h1>
          <span class="badge" :class="playlist.isPublic ? 'text-bg-success' : 'text-bg-secondary'">
            <i class="bi" :class="playlist.isPublic ? 'bi-globe' : 'bi-lock-fill'"></i>
            {{ playlist.isPublic ? 'Pública' : 'Privada' }}
          </span>
        </div>
        <p v-if="playlist.description" class="mt-2 mb-2">{{ playlist.description }}</p>
        <p class="text-secondary small mb-0">
          <router-link
            v-if="playlist.owner"
            :to="{ name: 'public-profile', params: { username: playlist.owner.username } }"
            class="text-decoration-none"
          >
            <img :src="getProfilePictureUrl(playlist.owner.profilePicture)" alt="" width="24" height="24" class="rounded-circle me-1" />{{ ownerName }}
          </router-link>
          <span class="ms-2">{{ plural(playlist.episodesCount) }}</span>
        </p>
        <router-link v-if="isOwner" to="/my-playlists" class="d-inline-block mt-2 small">
          <i class="bi bi-arrow-left"></i> Minhas Playlists
        </router-link>
      </div>

      <p v-if="playlist.episodes.length === 0" class="text-secondary">
        <template v-if="isOwner">
          Esta playlist está vazia. Abra um episódio e use o botão <strong>Salvar</strong> para adicioná-lo aqui.
          <router-link to="/feed">Explore o feed</router-link>.
        </template>
        <template v-else>Esta playlist ainda não tem episódios.</template>
      </p>

      <div v-else class="episode-grid">
        <EpisodeCard v-for="episode in playlist.episodes" :key="episode.id" :episode="episode">
          <template v-if="isOwner" #actions>
            <button
              type="button"
              class="btn btn-outline-danger btn-sm"
              :disabled="removing.has(episode.id)"
              @click="removeEpisode(episode)"
            >
              <i class="bi bi-x-lg"></i> Remover da playlist
            </button>
          </template>
        </EpisodeCard>
      </div>
    </template>
  </div>
</template>
