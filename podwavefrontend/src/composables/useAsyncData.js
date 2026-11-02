import { ref, watch as vueWatch, onMounted } from 'vue'
import { MESSAGES } from '../config/constants'

/**
 * useAsyncData(fetcher, options) — o esqueleto isLoading / error / try-catch-
 * finally de toda tela que LÊ dados, num lugar só.
 *
 * `fetcher` é uma FUNÇÃO que devolve a promessa: useAsyncData(() => getX(id)),
 * e NÃO useAsyncData(getX(id)). Com getX(id) a requisição dispararia na hora
 * de montar o composable (uma vez, sem controle) e o que chegaria aqui seria
 * uma promessa já pronta, impossível de repetir no "Tentar de novo", no
 * refresh ou quando o parâmetro da rota mudar. Com a função, quem decide
 * QUANDO chamar é o composable.
 *
 * Corrida entre respostas: o usuário abre o episódio 1 e, antes de ele
 * carregar, o episódio 2. Se a resposta do 2 chegar primeiro e a do 1 depois,
 * a tela mostraria o 1 na URL do 2. `lastCallId` numera cada chamada; só a
 * ÚLTIMA pode escrever data/error/isLoading — respostas antigas são ignoradas.
 *
 * Opções:
 *  - watch: função/fonte reativa (ex.: () => route.params.id); quando muda, recarrega
 *  - immediate: carrega ao montar (padrão true)
 *  - transform: res => res.data (padrão) — o que guardar em `data`
 *  - initialData: valor inicial de `data` (padrão null)
 *  - resetOnExecute: zera `data` ao recarregar (padrão true; usePaginatedList usa false)
 *
 * Erro de LEITURA fica na tela (`error`), não vira toast (ver api.js).
 */
export function useAsyncData(fetcher, options = {}) {
  const {
    watch: source,
    immediate = true,
    transform = (response) => response.data,
    initialData = null,
    resetOnExecute = true,
  } = options

  const data = ref(initialData)
  const error = ref('')
  const isLoading = ref(false)
  let lastCallId = 0

  // Devolve os dados (sucesso e chamada ainda atual) ou undefined (falha ou
  // chamada obsoleta). Nunca lança.
  async function execute() {
    const callId = ++lastCallId
    isLoading.value = true
    error.value = ''
    if (resetOnExecute) data.value = initialData

    try {
      const result = transform(await fetcher())
      if (callId !== lastCallId) return undefined
      data.value = result
      return result
    } catch (err) {
      if (callId !== lastCallId) return undefined
      error.value = err?.message || MESSAGES.LOAD_ERROR
      return undefined
    } finally {
      if (callId === lastCallId) isLoading.value = false
    }
  }

  if (source) vueWatch(source, execute)
  if (immediate) onMounted(execute)

  return { data, error, isLoading, execute, refresh: execute }
}
