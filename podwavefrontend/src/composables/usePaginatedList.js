import { computed, ref } from 'vue'
import { PAGE_SIZE } from '../config/constants'
import { useAsyncData } from './useAsyncData'

/**
 * usePaginatedList(fetchPage, { pageSize }) — lista com "Carregar mais".
 * fetchPage(page, pageSize) devolve a resposta da API (data = array).
 * Array com menos itens que pageSize (ou vazio) = não há mais páginas.
 *
 * Construído sobre useAsyncData: ele cuida de isLoading/error/corrida; aqui só
 * se acumulam os itens e se conta a página.
 */
export function usePaginatedList(fetchPage, { pageSize = PAGE_SIZE, immediate = true } = {}) {
  const items = ref([])
  const page = ref(0) // última página já carregada (0 = nenhuma)
  const hasMore = ref(true)

  const { execute, isLoading, error } = useAsyncData(
    () => fetchPage(page.value + 1, pageSize),
    { immediate: false, resetOnExecute: false, initialData: [] }
  )

  async function fetchNextPage() {
    const nextItems = await execute()
    if (nextItems === undefined) return // falhou (ou ficou obsoleta): page/items ficam como estavam
    items.value.push(...nextItems)
    page.value += 1
    hasMore.value = nextItems.length === pageSize
  }

  async function loadMore() {
    if (isLoading.value || !hasMore.value) return
    await fetchNextPage()
  }

  // Aula 14 — "Atualizar": recomeça da página 1 (os itens novos ficam no
  // topo). Não espera um "Carregar mais" em andamento terminar: o lastCallId
  // do useAsyncData descarta a resposta antiga, que chega como undefined.
  async function reload() {
    items.value = []
    page.value = 0
    hasMore.value = true
    await fetchNextPage()
  }

  if (immediate) loadMore()

  const isEmpty = computed(() => !isLoading.value && !error.value && items.value.length === 0)

  return { items, hasMore, isLoading, error, isEmpty, loadMore, reload }
}
