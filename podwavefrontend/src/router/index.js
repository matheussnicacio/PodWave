import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'

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
    path: '/liked',
    name: 'liked-episodes',
    component: () => import('../views/podcasts/LikedEpisodesView.vue'),
    meta: { requiresAuth: true }
  },

  // Aula 13 — playlists. A LISTA é só da pessoa logada (requiresAuth); o
  // DETALHE é público (sem requiresAuth): uma playlist pública pode ser aberta
  // por link, inclusive por visitante. A API decide (403) quando é privada.
  {
    path: '/my-playlists',
    name: 'my-playlists',
    component: () => import('../views/playlists/MyPlaylistsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/playlists/:id',
    name: 'playlist-detail',
    component: () => import('../views/playlists/PlaylistDetailView.vue')
  },

  {
    path: '/profile',
    name: 'my-profile',
    component: () => import('../views/profile/MyProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    // Perfil público identificado pelo USERNAME (não pelo id numérico): é o
    // que a API aceita em GET /api/profile/:username e o que aparece na URL.
    path: '/profile/:username',
    name: 'public-profile',
    component: () => import('../views/profile/PublicProfileView.vue')
  },
  // Aula 11 — seguir pessoas. UMA tela (FollowListView) para as DUAS listas:
  // a rota entrega `kind` por props e a tela decide qual lista buscar. São
  // públicas, como o perfil.
  {
    path: '/profile/:username/followers',
    name: 'followers',
    component: () => import('../views/profile/FollowListView.vue'),
    props: { kind: 'followers' }
  },
  {
    path: '/profile/:username/following',
    name: 'following-list',
    component: () => import('../views/profile/FollowListView.vue'),
    props: { kind: 'following' }
  },
  // Feed de quem eu sigo. O path é o MESMO do item "Seguindo" da Sidebar.
  {
    path: '/following',
    name: 'following-feed',
    component: () => import('../views/FollowingFeedView.vue'),
    meta: { requiresAuth: true }
  },

  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('../views/NotificationsView.vue'),
    meta: { requiresAuth: true }
  },

  // Aula 15 — painel de administração: UMA rota pai com o layout (abas) e as
  // quatro telas como FILHAS (paths relativos, sem barra: 'reports' vira
  // /admin/reports). O `meta` fica no PAI: o Vue Router junta os meta de
  // todos os níveis em to.meta, então as quatro filhas herdam requiresAuth e
  // requiresAdmin sem repetir. /admin sozinho redireciona para o Dashboard
  // (é para onde aponta o link da Sidebar). Os `name` são os mesmos de antes.
  {
    path: '/admin',
    component: () => import('../components/layout/AdminLayout.vue'),
    redirect: { name: 'admin-dashboard' },
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboardView.vue') },
      { path: 'reports', name: 'admin-reports', component: () => import('../views/admin/AdminReportsView.vue') },
      { path: 'users', name: 'admin-users', component: () => import('../views/admin/AdminUsersView.vue') },
      { path: 'podcasts', name: 'admin-podcasts', component: () => import('../views/admin/AdminPodcastsView.vue') },
    ],
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
// useAuth() (e, por baixo, useAuthStore()) é chamado AQUI DENTRO do
// callback, não no topo do arquivo, porque no topo do arquivo o Pinia
// ainda não foi registrado na aplicação (isso só acontece em main.js, com
// app.use(createPinia())). Chamar useAuth() antes disso lançaria erro de
// "no active Pinia".
router.beforeEach((to) => {
  const { isAuthenticated, isAdmin } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Aula 15 — guarda por PAPEL (depois da de login: o visitante vai ao Login,
  // não ao Feed). Logado sem papel -> Feed, com aviso.
  //
  // ATENÇÃO: esta guarda é só CONFORTO (não mostrar uma tela que não serve
  // para a pessoa). Ela lê o isAdmin do localStorage, que qualquer um edita no
  // DevTools. Quem protege os DADOS é a API: o isAdmin do banco, conferido em
  // toda requisição (router.use('/admin', isAuthenticated, isAdmin)). Com o
  // localStorage falsificado, o painel abre vazio e cada tela recebe 403.
  if (to.meta.requiresAdmin && !isAdmin.value) {
    useToast().error('Você não tem permissão para acessar a administração.')
    return { name: 'feed' }
  }

  return true
})

export default router
