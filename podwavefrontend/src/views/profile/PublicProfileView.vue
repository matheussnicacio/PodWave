<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getPublicProfile } from '../../services/authService'
import { useAsyncData } from '../../composables/useAsyncData'
import { getProfilePictureUrl } from '../../utils/media'
import EpisodeCard from '../../components/episodes/EpisodeCard.vue'
import FollowButton from '../../components/follow/FollowButton.vue'

const route = useRoute()

// Recarrega ao trocar de :username (de um perfil para outro sem recriar a tela).
const { data, error, isLoading } = useAsyncData(
  () => getPublicProfile(route.params.username),
  { watch: () => route.params.username }
)

// `profile` é um ref PRÓPRIO (copiado de data): o FollowButton edita
// profile.isFollowing e profile.followersCount por v-model, e o cartão muda
// junto. Um computed devolveria um objeto novo a cada leitura e a edição se perderia.
const profile = ref(null)
watch(data, (value) => {
  if (!value) {
    profile.value = null
    return
  }
  const { isOwner, episodes, ...rest } = value
  profile.value = rest
})
const episodes = computed(() => data.value?.episodes ?? [])
const isOwner = computed(() => data.value?.isOwner ?? false)
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
          <!-- Os números viram links para as listas (rotas públicas). O contador
               de seguidores é o MESMO profile.followersCount que o FollowButton
               edita por v-model: muda junto com o botão. -->
          <p class="text-secondary small mb-3">
            <strong>{{ profile.episodesCount }}</strong> episódios ·
            <router-link
              :to="{ name: 'followers', params: { username: profile.username } }"
              class="profile-stat-link"
            ><strong>{{ profile.followersCount }}</strong> seguidores</router-link> ·
            <router-link
              :to="{ name: 'following-list', params: { username: profile.username } }"
              class="profile-stat-link"
            ><strong>{{ profile.followingCount }}</strong> seguindo</router-link>
          </p>

          <!-- Dois casos: dono / qualquer outra pessoa. O visitante também vê o
               botão: o clique dele leva ao login e volta ao perfil (feito dentro
               do FollowButton). Esconder o botão não é segurança: a API recusa. -->
          <router-link v-if="isOwner" :to="{ name: 'my-profile' }" class="btn btn-outline-primary">
            <i class="bi bi-pencil-square"></i> Editar Perfil
          </router-link>
          <FollowButton
            v-else
            :user-id="profile.id"
            v-model:following="profile.isFollowing"
            v-model:followers-count="profile.followersCount"
          />
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
