<script setup>
import { onMounted, ref } from 'vue'
import { getMyProfile } from '../../services/authService'

const profile = ref(null)
const errorMessage = ref('')
const isLoading = ref(true)

onMounted(async () => {
  try {
    const response = await getMyProfile()
    profile.value = response.data
    // Confirmação, no Console, de que o token enviado pelo interceptor de
    // requisição realmente autenticou a chamada a uma rota protegida.
    console.log('Perfil autenticado OK:', response.data)
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="container py-4">
    <h1 class="h3 mb-4">Meu Perfil</h1>

    <p v-if="isLoading" class="text-secondary">Carregando...</p>

    <div v-else-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

    <div v-else-if="profile" class="card" style="max-width: 480px">
      <div class="card-body">
        <h2 class="h5 mb-1">{{ profile.fullName }}</h2>
        <p class="text-secondary mb-3">@{{ profile.username }}</p>
        <ul class="list-unstyled small text-secondary mb-0">
          <li><strong>E-mail:</strong> {{ profile.email }}</li>
          <li><strong>Episódios:</strong> {{ profile.episodesCount }}</li>
          <li><strong>Seguidores:</strong> {{ profile.followersCount }}</li>
          <li><strong>Seguindo:</strong> {{ profile.followingCount }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>
