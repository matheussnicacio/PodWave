import { onMounted, onBeforeUnmount } from 'vue'

/**
 * useClickOutside(elementRef, callback)
 *
 * Chama `callback` quando o usuário clica em qualquer lugar FORA do elemento
 * apontado por `elementRef` (uma ref de template). É um composable, não um
 * componente: só empacota lógica (um listener global com ciclo de vida), sem
 * desenhar nada.
 *
 * O listener fica no `document` e é removido em onBeforeUnmount — sem isso,
 * cada vez que o componente fosse criado e destruído sobraria um listener
 * "fantasma" apontando para um elemento que não existe mais.
 *
 * O botão que ABRE o menu deve estar DENTRO do elemento observado: assim o
 * clique nele conta como "dentro" e não fecha o menu no mesmo instante em que
 * o toggle o abriu.
 */
export function useClickOutside(elementRef, callback) {
  function handleClick(event) {
    const el = elementRef.value
    if (el && !el.contains(event.target)) {
      callback(event)
    }
  }

  onMounted(() => document.addEventListener('click', handleClick))
  onBeforeUnmount(() => document.removeEventListener('click', handleClick))
}
