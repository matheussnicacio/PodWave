import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'landing', component: () => import('../views/LandingView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/auth/LoginView.vue') },
  { path: '/register', name: 'register', component: () => import('../views/auth/RegisterView.vue') },

  { path: '/feed', name: 'feed', component: () => import('../views/FeedView.vue') },
  { path: '/search', name: 'search', component: () => import('../views/SearchView.vue') },

  {
    path: '/upload',
    name: 'upload',
    component: () => import('../views/UploadView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/podcasts/:id',
    name: 'podcast-detail',
    component: () => import('../views/podcasts/PodcastDetailView.vue')
  },
  {
    path: '/podcasts/:id/edit',
    name: 'podcast-edit',
    component: () => import('../views/podcasts/EditPodcastView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-podcasts',
    name: 'my-podcasts',
    component: () => import('../views/podcasts/MyPodcastsView.vue'),
    meta: { requiresAuth: true }
  },

  {
    path: '/profile',
    name: 'my-profile',
    component: () => import('../views/profile/MyProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users/:id',
    name: 'public-profile',
    component: () => import('../views/profile/PublicProfileView.vue')
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('../views/NotificationsView.vue'),
    meta: { requiresAuth: true }
  },

  {
    path: '/admin',
    name: 'admin-dashboard',
    component: () => import('../views/admin/AdminDashboardView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/reports',
    name: 'admin-reports',
    component: () => import('../views/admin/AdminReportsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('../views/admin/AdminUsersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/podcasts',
    name: 'admin-podcasts',
    component: () => import('../views/admin/AdminPodcastsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guarda de rota global: bloqueia acesso direto a rotas com
// meta: { requiresAuth: true } quando não há sessão ativa.
//
// useAuthStore() é chamado AQUI DENTRO do callback, não no topo do arquivo,
// porque no topo do arquivo o Pinia ainda não foi registrado na aplicação
// (isso só acontece em main.js, com app.use(createPinia())). Chamar
// useAuthStore() antes disso lançaria erro de "no active Pinia".
router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'feed' }
  }

  return true
})

export default router
