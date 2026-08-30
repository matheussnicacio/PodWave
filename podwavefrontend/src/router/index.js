import { createRouter, createWebHistory } from 'vue-router'

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

export default router
