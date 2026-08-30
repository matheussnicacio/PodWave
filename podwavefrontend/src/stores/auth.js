import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin'
  },
  actions: {
    setSession(user, token) {
      this.user = user
      this.token = token
    },
    logout() {
      this.user = null
      this.token = null
    }
  }
})
