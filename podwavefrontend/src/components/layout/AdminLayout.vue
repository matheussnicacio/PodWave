<script setup>
// Aula 15 — moldura do painel: título, as quatro abas e, embaixo, a tela da
// aba atual (<router-view />, as rotas FILHAS de /admin).
//
// As abas são <router-link> pelo NOME da rota (não pelo caminho): se o path
// mudar um dia, os links continuam certos. active-class="active" troca a
// classe padrão do Vue Router (router-link-active) pela classe que o Bootstrap
// usa para destacar a pílula atual.
const tabs = [
  { name: 'admin-dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { name: 'admin-reports', label: 'Denúncias', icon: 'bi-flag' },
  { name: 'admin-users', label: 'Usuários', icon: 'bi-people' },
  { name: 'admin-podcasts', label: 'Episódios', icon: 'bi-mic' },
]
</script>

<template>
  <div class="p-4">
    <h1 class="h3 mb-3"><i class="bi bi-shield-lock"></i> Administração</h1>

    <nav aria-label="Seções do painel de administração" class="mb-4">
      <ul class="nav nav-pills gap-2">
        <li v-for="tab in tabs" :key="tab.name" class="nav-item">
          <router-link :to="{ name: tab.name }" class="nav-link" active-class="active">
            <i class="bi" :class="tab.icon"></i> {{ tab.label }}
          </router-link>
        </li>
      </ul>
    </nav>

    <router-view />
  </div>
</template>
