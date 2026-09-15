<script setup>
import { useAuth } from '../../composables/useAuth'

// Os três links abaixo sempre existiram e já tinham suas rotas protegidas
// por meta: { requiresAuth: true } (e requiresAdmin, no caso do Admin) no
// guarda de rota (router/index.js). O que faltava era a Sidebar refletir
// visualmente essa mesma regra: nenhum link novo foi criado aqui, só
// deixamos de mostrar, deslogado, um atalho para uma tela que o guarda de
// rota ia bloquear e redirecionar de qualquer forma.
const { isAuthenticated, isAdmin } = useAuth()
</script>

<template>
  <aside class="sidebar">
    <template v-if="isAuthenticated">
      <router-link to="/my-podcasts"><i class="bi bi-mic"></i> Meus Podcasts</router-link>
      <router-link to="/notifications"><i class="bi bi-bell"></i> Notificações</router-link>
      <router-link v-if="isAdmin" to="/admin"><i class="bi bi-shield-lock"></i> Admin</router-link>
    </template>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 200px;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-right: 1px solid #26262e;
  background-color: #121216;
}

.sidebar a {
  opacity: 0.8;
}

.sidebar a.router-link-active {
  opacity: 1;
  font-weight: 600;
}
</style>
