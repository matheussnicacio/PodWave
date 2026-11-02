import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from './useAuth'

/**
 * useAuthenticatedAction() — a "cerca" repetida dos botões de ação social
 * (curtir, seguir): visitante vai para o login (voltando depois, via
 * ?redirect=) e, enquanto uma ação está em andamento, novos cliques são
 * ignorados (isBusy) — três cliques rápidos geram UMA requisição.
 *
 * run(action): `action` é async e cuida do seu próprio rollback visual no
 * catch. O AVISO de erro não é dela: quem avisa é o toast do interceptor.
 */
export function useAuthenticatedAction() {
  const route = useRoute()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const isBusy = ref(false)

  async function run(action) {
    if (!isAuthenticated.value) {
      router.push({ name: 'login', query: { redirect: route.fullPath } })
      return undefined
    }
    if (isBusy.value) return undefined

    isBusy.value = true
    try {
      return await action()
    } finally {
      isBusy.value = false
    }
  }

  return { run, isBusy }
}
