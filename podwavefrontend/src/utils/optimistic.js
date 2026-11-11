/**
 * runOptimistic({ apply, request, confirm }) — o esqueleto da ATUALIZAÇÃO
 * OTIMISTA, extraído no terceiro caso (curtir, seguir, marcar playlist).
 *
 * O que é IGUAL nos três: mudar a tela antes, chamar a API, e na resposta
 * acertar com o servidor (sucesso) ou desfazer (erro). O que MUDA de um para
 * outro fica nas três funções que cada caso passa:
 *
 *  - apply():   muda a tela JÁ e DEVOLVE a função que desfaz essa mudança.
 *               Quem aplicou é quem sabe desfazer: só ele conhece o estado
 *               anterior (guardado no fechamento da função). Assim o undo
 *               nunca fica dessincronizado do que foi feito.
 *  - request(): devolve a PROMESSA da chamada à API.
 *  - confirm(data): no sucesso, acerta a tela com o valor REAL do servidor.
 *
 * Sem `if`, sem toast: o aviso de erro é do interceptor do api.js; aqui só
 * se desfaz o visual. O erro não é relançado — para quem chamou, a operação
 * terminou (com ou sem sucesso) e a tela já está coerente.
 *
 * @returns {Promise<boolean>} true se a API aceitou, false se houve rollback.
 */
export async function runOptimistic({ apply, request, confirm }) {
  const undo = apply()
  try {
    const response = await request()
    confirm(response.data)
    return true
  } catch {
    undo()
    return false
  }
}
