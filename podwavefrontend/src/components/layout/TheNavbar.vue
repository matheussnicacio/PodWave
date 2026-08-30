<template>
  <header class="navbar">
    <router-link to="/" class="brand">PodWave</router-link>
    <nav>
      <router-link to="/feed">Feed</router-link>
      <router-link to="/search">Buscar</router-link>
      <router-link to="/upload">Publicar</router-link>
      <router-link to="/profile">Perfil</router-link>
      <router-link to="/register">Criar Conta</router-link>
      <router-link to="/login">Entrar</router-link>
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
  gap: 1.25rem;
}

nav a {
  opacity: 0.8;
}

nav a.router-link-active {
  opacity: 1;
  font-weight: 600;
}
</style>
