import { defineStore } from 'pinia'
import { login as loginRequest, logout as logoutRequest } from '../services/authService'
import { STORAGE_KEYS } from '../config/constants'

function loadStoredUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.USER)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: loadStoredUser(),
    token: localStorage.getItem(STORAGE_KEYS.TOKEN) || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => !!state.user?.isAdmin,
  },
  actions: {
    setSession(user, token) {
      this.user = user
      this.token = token
      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    },

    clearSession() {
      this.user = null
      this.token = null
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
    },

    // Atualiza só os dados do usuário (mantém o token intacto). Usado depois
    // de um PUT /profile/me bem-sucedido, para que o resto da aplicação
    // (Navbar, guardas de rota, etc.) enxergue o nome/bio/foto novos sem
    // precisar de F5 ou de um novo login.
    updateUser(user) {
      this.user = user
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    },

    async login(credentials) {
      const response = await loginRequest(credentials)
      const { token, user } = response.data
      this.setSession(user, token)
      return user
    },

    async logout() {
      try {
        // Best-effort: o endpoint existe por convenção de API, mas quem
        // realmente encerra a sessão é o front, limpando o token local
        // (ver Etapa 8 do enunciado — JWT stateless não é revogável no servidor).
        await logoutRequest()
      } catch {
        // Mesmo que a chamada falhe (API fora do ar, por exemplo), a sessão
        // local é encerrada de qualquer forma.
      } finally {
        this.clearSession()
      }
    },
  },
})
