<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="navbar">
    <router-link to="/" class="brand">PodWave</router-link>
    <nav>
      <router-link to="/feed">Feed</router-link>
      <router-link to="/search">Buscar</router-link>

      <template v-if="authStore.isAuthenticated">
        <router-link to="/upload">Publicar</router-link>
        <router-link to="/profile">Perfil</router-link>
        <button type="button" class="logout-link" @click="handleLogout">Sair</button>
      </template>

      <template v-else>
        <router-link to="/register">Criar Conta</router-link>
        <router-link to="/login">Entrar</router-link>
      </template>
    </nav>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #26262e;
  background-color: #16161c;
}

.brand {
  font-weight: bold;
  font-size: 1.25rem;
}

nav {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

nav a {
  opacity: 0.8;
}

nav a.router-link-active {
  opacity: 1;
  font-weight: 600;
}

.logout-link {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font: inherit;
  opacity: 0.8;
}

.logout-link:hover {
  opacity: 1;
}
</style>
