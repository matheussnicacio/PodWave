import { computed, ref, watch } from 'vue'
import { PAGE_SIZE, MESSAGES } from '../config/constants'

/**
 * usePaginatedList(fetchPage, { pageSize, immediate }, { watch }) — lista com
 * "Carregar mais".
 *
 * fetchPage(page, pageSize) devolve a resposta da API (data = array). Array
 * com menos itens que pageSize (ou vazio) = não há mais páginas.
 *
 * Aula 15 — dois acréscimos (as telas antigas continuam chamando
 * usePaginatedList(getFeed) exatamente como antes):
 *
 * 1) Terceiro parâmetro { watch: source }: quando a fonte muda (o filtro das
 *    denúncias, o termo da busca), a lista RECOMEÇA da página 1
 *    (loadFirstPage). As telas do painel passam `undefined` no segundo
 *    parâmetro para usar o tamanho de página padrão.
 *
 * 2) A guarda contra a resposta VELHA (lastCallId): a pessoa clica em
 *    "Revisadas" e logo em "Todas". Se a resposta de "Revisadas" chegar
 *    DEPOIS da de "Todas", a tela mostraria a lista errada sob o botão
 *    "Todas". Cada loadFirstPage ganha um número; só a resposta da ÚLTIMA
 *    pode escrever items/error/isLoading (a conferência está no try, no
 *    catch e no finally). O loadMore guarda o número do momento em que
 *    começou: se um loadFirstPage começou no meio do caminho (filtro novo),
 *    a página 2 da lista ANTIGA chega e é descartada — não se mistura com a
 *    lista nova.
 */
export function usePaginatedList(
  fetchPage,
  { pageSize = PAGE_SIZE, immediate = true } = {},
  { watch: source = null } = {}
) {
  const items = ref([])
  const page = ref(0) // última página já carregada (0 = nenhuma)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const error = ref('')
  let lastCallId = 0

  // Recomeça do zero: página 1, lista vazia. Usado na montagem, no
  // "Atualizar" (reload) e quando a fonte observada muda.
  async function loadFirstPage() {
    const callId = ++lastCallId
    items.value = []
    page.value = 0
    hasMore.value = true
    isLoading.value = true
    error.value = ''

    try {
      const response = await fetchPage(1, pageSize)
      if (callId !== lastCallId) return
      const firstItems = response.data
      items.value = firstItems
      page.value = 1
      hasMore.value = firstItems.length === pageSize
    } catch (err) {
      if (callId !== lastCallId) return
      error.value = err?.message || MESSAGES.LOAD_ERROR
    } finally {
      if (callId === lastCallId) isLoading.value = false
    }
  }

  async function loadMore() {
    if (isLoading.value || !hasMore.value) return
    // Nada carregado ainda (a primeira página falhou): "Tentar de novo"
    // recomeça pela página 1.
    if (page.value === 0) return loadFirstPage()

    const callId = lastCallId // NÃO incrementa: só confere se continua o mesmo
    isLoading.value = true
    error.value = ''

    try {
      const response = await fetchPage(page.value + 1, pageSize)
      if (callId !== lastCallId) return // a lista recomeçou: resposta velha
      const nextItems = response.data
      items.value.push(...nextItems)
      page.value += 1
      hasMore.value = nextItems.length === pageSize
    } catch (err) {
      if (callId !== lastCallId) return
      error.value = err?.message || MESSAGES.LOAD_ERROR
    } finally {
      if (callId === lastCallId) isLoading.value = false
    }
  }

  if (source) watch(source, loadFirstPage)
  if (immediate) loadFirstPage()

  const isEmpty = computed(() => !isLoading.value && !error.value && items.value.length === 0)

  // reload = loadFirstPage (nome mantido: NotificationsView já usa "reload").
  return { items, hasMore, isLoading, error, isEmpty, loadMore, reload: loadFirstPage, loadFirstPage }
}
