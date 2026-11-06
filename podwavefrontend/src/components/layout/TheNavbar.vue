<script setup>
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useClickOutside } from '../../composables/useClickOutside'
import { getProfilePictureUrl } from '../../utils/media'
import { useNotificationsStore } from '../../stores/notifications'

const router = useRouter()
const { user, isAuthenticated, logout } = useAuth()

// Sino (Aula 14). O número vem da store; quem LIGA e DESLIGA o polling é este
// watch: entrou na conta -> startPolling(); saiu -> stopPolling().
// immediate: true cobre quem abre o site já logado (F5).
const notificationsStore = useNotificationsStore()
const unreadCount = computed(() => notificationsStore.unreadCount)
const unreadBadge = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))
const bellLabel = computed(() => (unreadCount.value > 0
  ? `Notificações (${unreadCount.value} não ${unreadCount.value === 1 ? 'lida' : 'lidas'})`
  : 'Notificações'))

watch(
  isAuthenticated,
  (loggedIn) => {
    if (loggedIn) notificationsStore.startPolling()
    else notificationsStore.stopPolling()
  },
  { immediate: true }
)

onUnmounted(() => notificationsStore.stopPolling())

// O menu é controlado por ESTADO (isMenuOpen + v-if), não por CSS :hover:
// no celular não existe hover, e :hover fecharia o menu no meio do caminho
// do mouse até o item.
const isMenuOpen = ref(false)
const menuRef = ref(null)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

// Fecha ao clicar fora (o botão do avatar está DENTRO de menuRef, então o
// clique nele é tratado só pelo toggleMenu).
useClickOutside(menuRef, closeMenu)

function onKeydown(event) {
  if (event.key === 'Escape') closeMenu()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

// Barra de busca (Aula 13): Enter (ou a lupa) leva à tela de busca já com o
// termo na URL (?q=). Vazio é ignorado. O campo é limpo depois: a busca
// continua na própria tela de Explorar, que lê o termo da URL.
const searchText = ref('')

function submitSearch() {
  const q = searchText.value.trim()
  if (!q) return
  router.push({ name: 'search', query: { q } })
  searchText.value = ''
}

async function handleLogout() {
  closeMenu()
  await logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="navbar">
    <router-link to="/" class="brand">PodWave</router-link>
    <nav>
      <router-link to="/feed"><i class="bi bi-house"></i> Feed</router-link>
      <!-- Visível também para visitantes: buscar não exige login. -->
      <form role="search" class="navbar-search" @submit.prevent="submitSearch">
        <input
          v-model="searchText"
          type="search"
          class="form-control form-control-sm"
          placeholder="Buscar episódios e pessoas"
          aria-label="Buscar episódios e pessoas"
          maxlength="100"
        />
        <button type="submit" class="btn btn-sm btn-outline-secondary" aria-label="Buscar">
          <i class="bi bi-search"></i>
        </button>
      </form>

      <template v-if="isAuthenticated">
        <router-link to="/upload"><i class="bi bi-upload"></i> Publicar</router-link>

        <!-- Sino: só para quem está logado. O selo só aparece com não lidas;
             o aria-label diz o número para quem usa leitor de tela. -->
        <router-link
          :to="{ name: 'notifications' }"
          class="btn btn-sm btn-outline-secondary position-relative bell-button"
          :aria-label="bellLabel"
          :title="bellLabel"
        >
          <i class="bi bi-bell"></i>
          <span
            v-if="unreadCount > 0"
            class="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-danger"
            aria-hidden="true"
          >{{ unreadBadge }}</span>
        </router-link>

        <div ref="menuRef" class="user-menu">
          <button
            type="button"
            class="avatar-button"
            aria-haspopup="menu"
            :aria-expanded="isMenuOpen"
            aria-label="Menu do usuário"
            @click="toggleMenu"
          >
            <img :src="getProfilePictureUrl(user?.profilePicture)" alt="" class="avatar" />
            <i class="bi bi-chevron-down small"></i>
          </button>

          <div v-if="isMenuOpen" class="user-menu-dropdown" role="menu">
            <router-link to="/profile" role="menuitem" @click="closeMenu">
              <i class="bi bi-pencil-square"></i> Editar Perfil
            </router-link>
            <router-link
              v-if="user?.username"
              :to="{ name: 'public-profile', params: { username: user.username } }"
              role="menuitem"
              @click="closeMenu"
            >
              <i class="bi bi-person-circle"></i> Ver Perfil
            </router-link>
            <router-link to="/my-podcasts" role="menuitem" @click="closeMenu">
              <i class="bi bi-mic"></i> Meus Podcasts
            </router-link>
            <router-link to="/liked" role="menuitem" @click="closeMenu">
              <i class="bi bi-heart"></i> Curtidos
            </router-link>
            <router-link to="/my-playlists" role="menuitem" @click="closeMenu">
              <i class="bi bi-collection-play"></i> Minhas Playlists
            </router-link>
            <hr class="my-1" />
            <button type="button" class="menu-logout" role="menuitem" @click="handleLogout">
              <i class="bi bi-box-arrow-right"></i> Sair
            </button>
          </div>
        </div>
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
  border-bottom: 1px solid var(--pw-border);
  background-color: var(--pw-surface);
}

.brand {
  color: var(--podwave-brand);
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

.bell-button {
  opacity: 1;
}

.navbar-search {
  display: flex;
  gap: 0.35rem;
}

.navbar-search input {
  width: 220px;
}

@media (max-width: 720px) {
  .navbar-search input {
    width: 140px;
  }
}

/* Wrapper com position: relative: o dropdown (absolute) se ancora nele e
   alinha pela DIREITA (right: 0), crescendo para a esquerda — o avatar fica
   na ponta direita da navbar, então alinhar pela esquerda estouraria a tela. */
.user-menu {
  position: relative;
}

.avatar-button {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  padding: 0;
  color: inherit;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--pw-border);
}

.user-menu-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 190px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 0.35rem;
  background-color: var(--pw-surface);
  border: 1px solid var(--pw-border);
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.user-menu-dropdown a,
.menu-logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
  opacity: 1;
  font-weight: 400;
  background: none;
  border: none;
  font: inherit;
  text-align: left;
  width: 100%;
}

.user-menu-dropdown a:hover,
.menu-logout:hover {
  background-color: var(--pw-surface-alt);
}
</style>
