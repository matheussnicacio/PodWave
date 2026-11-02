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

  async function loadMore() {
    if (isLoading.value || !hasMore.value) return
    const nextItems = await execute()
    if (nextItems === undefined) return // falhou: page/items ficam como estavam
    items.value.push(...nextItems)
    page.value += 1
    hasMore.value = nextItems.length === pageSize
  }

  if (immediate) loadMore()

  const isEmpty = computed(() => !isLoading.value && !error.value && items.value.length === 0)

  return { items, hasMore, isLoading, error, isEmpty, loadMore }
}
