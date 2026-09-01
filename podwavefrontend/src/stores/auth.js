import { defineStore } from 'pinia'
import { login as loginRequest, logout as logoutRequest } from '../services/authService'
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../utils/storageKeys'

function loadStoredUser() {
  const raw = localStorage.getItem(USER_STORAGE_KEY)
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
    token: localStorage.getItem(TOKEN_STORAGE_KEY) || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => !!state.user?.isAdmin,
  },
  actions: {
    setSession(user, token) {
      this.user = user
      this.token = token
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    },

    clearSession() {
      this.user = null
      this.token = null
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
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
