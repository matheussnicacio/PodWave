import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

/**
 * useAuth() — composable, não componente.
 *
 * A diferença entre os dois: um componente (BaseInput, BaseButton,
 * FormCard) sempre gera um pedaço de <template> na tela — ele "desenha"
 * alguma coisa. Um composable é só uma função que empacota e reaproveita
 * *lógica com estado* (reactive/computed/etc.), sem nenhum template
 * próprio — ele não desenha nada sozinho, só devolve dados e funções para
 * quem chamou usar no template que já existe.
 *
 * Por que este composable existe, e não um acesso direto a useAuthStore()
 * em cada arquivo: guarda de rota, Navbar e Sidebar precisavam, cada um,
 * repetir `const authStore = useAuthStore()` e depois ler
 * `authStore.isAuthenticated` / `authStore.isAdmin` / `authStore.user`
 * diretamente. Isso não está errado, mas espalha o conhecimento de *como*
 * a sessão é representada (Pinia, com esses nomes exatos de getters) por
 * três arquivos diferentes. Com useAuth(), esse conhecimento fica
 * concentrado num único lugar: se um dia a store mudar de nome, ganhar
 * outro getter ou até deixar de ser Pinia, só este arquivo muda — guarda
 * de rota, Navbar e Sidebar continuam chamando useAuth() exatamente como
 * chamam hoje.
 */
export function useAuth() {
  const authStore = useAuthStore()

  const user = computed(() => authStore.user)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isAdmin = computed(() => authStore.isAdmin)

  function login(credentials) {
    return authStore.login(credentials)
  }

  function logout() {
    return authStore.logout()
  }

  function updateUser(updatedUser) {
    return authStore.updateUser({ ...authStore.user, ...updatedUser })
  }

  return {
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    updateUser,
  }
}
