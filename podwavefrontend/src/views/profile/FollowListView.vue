<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getPublicProfile } from '../../services/authService'
import { getFollowers, getFollowing } from '../../services/followService'
import { getProfilePictureUrl } from '../../utils/media'

// UMA tela, DUAS rotas (/profile/:username/followers e /following). Quem diz
// qual lista mostrar é a definição da rota, que entrega `kind` por props
// (router/index.js). A tela não olha a URL para decidir: só lê `kind`.
const props = defineProps({
  kind: { type: String, required: true, validator: (v) => ['followers', 'following'].includes(v) },
})

const route = useRoute()

const profile = ref(null)
const people = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

// Protege contra resposta atrasada (trocar de aba/perfil rápido): só a ÚLTIMA
// carga pode escrever no estado.
let latestRequest = 0

// DUAS chamadas em SEQUÊNCIA, e não em paralelo: a rota usa o USERNAME, mas a
// API de listas usa o ID numérico. Só dá para pedir a lista depois de o
// perfil ter devolvido o id.
async function loadList() {
  const requestId = ++latestRequest
  isLoading.value = true
  errorMessage.value = ''
  profile.value = null
  people.value = []

  try {
    const profileResponse = await getPublicProfile(route.params.username)
    if (requestId !== latestRequest) return
    const { episodes, isOwner, isFollowing, ...person } = profileResponse.data
    profile.value = person

    const fetchList = props.kind === 'followers' ? getFollowers : getFollowing
    const listResponse = await fetchList(person.id)
    if (requestId !== latestRequest) return
    people.value = listResponse.data
  } catch (err) {
    if (requestId !== latestRequest) return
    errorMessage.value = err.message || 'Não foi possível carregar a lista.'
  } finally {
    if (requestId === latestRequest) isLoading.value = false
  }
}

// Recarrega ao abrir E quando muda a aba (kind) ou a pessoa (username): o
// Vue Router reaproveita o componente entre rotas do mesmo componente.
watch(() => [props.kind, route.params.username], loadList, { immediate: true })

function displayName(person) {
  return person.fullName || person.username
}
</script>

<template>
  <div class="p-4">
    <router-link
      :to="{ name: 'public-profile', params: { username: route.params.username } }"
      class="d-inline-block mb-3"
    >
      <i class="bi bi-arrow-left"></i> Voltar ao perfil
    </router-link>

    <h1 class="h3 mb-3">
      <template v-if="profile">{{ displayName(profile) }}</template>
      <template v-else>@{{ route.params.username }}</template>
    </h1>

    <!-- Abas: a ativa vem de `kind` (não da URL). -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <router-link
          class="nav-link"
          :class="{ active: kind === 'followers' }"
          :to="{ name: 'followers', params: { username: route.params.username } }"
        >Seguidores<template v-if="profile"> ({{ profile.followersCount }})</template></router-link>
      </li>
      <li class="nav-item">
        <router-link
          class="nav-link"
          :class="{ active: kind === 'following' }"
          :to="{ name: 'following-list', params: { username: route.params.username } }"
        >Seguindo<template v-if="profile"> ({{ profile.followingCount }})</template></router-link>
      </li>
    </ul>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="errorMessage" class="alert alert-danger" role="alert">
      {{ errorMessage }}
      <router-link to="/feed" class="alert-link ms-2">Voltar ao feed</router-link>
    </div>

    <!-- Estados vazios com o NOME da pessoa. -->
    <p v-else-if="people.length === 0" class="text-secondary">
      <template v-if="kind === 'followers'">{{ displayName(profile) }} ainda não tem seguidores.</template>
      <template v-else>{{ displayName(profile) }} ainda não segue ninguém.</template>
    </p>

    <ul v-else class="follow-list">
      <li v-for="person in people" :key="person.id" class="follow-list-item">
        <router-link :to="{ name: 'public-profile', params: { username: person.username } }">
          <img
            :src="getProfilePictureUrl(person.profilePicture)"
            :alt="`Foto de ${person.username}`"
            class="follow-list-avatar"
            loading="lazy"
          />
        </router-link>
        <div class="follow-list-body">
          <router-link
            :to="{ name: 'public-profile', params: { username: person.username } }"
            class="follow-list-name"
          >{{ displayName(person) }}</router-link>
          <span class="text-secondary small ms-1">@{{ person.username }}</span>
          <p v-if="person.bio" class="follow-list-bio">{{ person.bio }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>
