import { onUnmounted, ref, watch } from 'vue'

/**
 * useDebouncedValue(source, delay) — uma cópia de `source` que só muda depois
 * de `delay` ms SEM mudanças.
 *
 * Cada mudança de `source` cancela o timer anterior (clearTimeout) e agenda um
 * novo. Enquanto a pessoa digita, o timer é cancelado a cada tecla; só quando
 * ela para por `delay` ms o valor "assenta" e quem observa o resultado (a
 * busca) reage UMA vez. Digitar "podcast" sem pausa = 1 requisição, não 7.
 *
 * O valor inicial é o valor ATUAL da origem (não ''): quem abre /search?q=rock
 * já começa com "rock", sem esperar o atraso.
 *
 * onUnmounted limpa o timer: sem isso, um timer agendado poderia disparar
 * depois que a tela saiu e escrever num componente que não existe mais.
 *
 * @param {import('vue').Ref|Function} source — ref ou getter
 * @param {number} delay — em ms
 */
export function useDebouncedValue(source, delay) {
  const read = typeof source === 'function' ? source : () => source.value
  const debounced = ref(read())
  let timer = null

  watch(read, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  onUnmounted(() => clearTimeout(timer))

  return debounced
}
