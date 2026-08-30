<template>
  <aside class="sidebar">
    <router-link to="/my-podcasts">Meus Podcasts</router-link>
    <router-link to="/notifications">Notificações</router-link>
    <router-link to="/admin">Admin</router-link>
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
