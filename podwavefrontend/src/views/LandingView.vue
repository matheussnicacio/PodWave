<script setup>
import { ref, onMounted } from 'vue'
import { getApiStatus } from '../services/systemService'

const apiStatus = ref('verificando...')

onMounted(async () => {
  try {
    const response = await getApiStatus()
    apiStatus.value = response.data.status
  } catch (error) {
    apiStatus.value = 'offline'
    console.error('Erro ao consultar a API:', error.message)
  }
})
</script>

<template>
  <div class="landing p-4">
    <h1>Bem-vindo ao PodWave</h1>
    <p>Sua plataforma para descobrir e compartilhar podcasts.</p>
    <p class="status">Status da API: <strong>{{ apiStatus }}</strong></p>
  </div>
</template>

<style scoped>
.landing {
  text-align: center;
  padding: 3rem 1rem;
}

.status {
  margin-top: 1rem;
}
</style>
