<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const { isAuthenticated, logout } = useAuth()

async function handleLogout() {
  await logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="navbar">
    <router-link to="/" class="brand">PodWave</router-link>
    <nav>
      <router-link to="/feed"><i class="bi bi-house"></i> Feed</router-link>
      <router-link to="/search"><i class="bi bi-search"></i> Buscar</router-link>

      <template v-if="isAuthenticated">
        <router-link to="/upload"><i class="bi bi-upload"></i> Publicar</router-link>
        <router-link to="/profile"><i class="bi bi-person-circle"></i> Perfil</router-link>
        <button type="button" class="logout-link" @click="handleLogout">
          <i class="bi bi-box-arrow-right"></i> Sair
        </button>
      </template>

      <template v-else>
        <router-link to="/register"><i class="bi bi-person-plus"></i> Criar Conta</router-link>
        <router-link to="/login"><i class="bi bi-box-arrow-in-right"></i> Entrar</router-link>
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
