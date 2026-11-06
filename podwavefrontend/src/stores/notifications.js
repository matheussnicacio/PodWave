import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getUnreadCount } from '../services/notificationService'
import { NOTIFICATIONS } from '../config/constants'

/**
 * Store do sino: o número de não lidas e o POLLING que o mantém atualizado.
 *
 * Por que uma store (e não um ref na Navbar): o número é lido pela Navbar e
 * escrito pela tela de Notificações (ao marcar como lida). Os dois precisam
 * enxergar o MESMO valor.
 *
 * Ciclo de vida: a Navbar chama startPolling() quando a pessoa entra na conta
 * e stopPolling() quando sai. Sem login, nenhuma requisição.
 */
export const useNotificationsStore = defineStore('notifications', () => {
  const unreadCount = ref(0)

  // Id do setInterval; null = polling desligado.
  let timerId = null

  // A CORRIDA DO CONTADOR: o polling pergunta "quantas?" (resposta lenta);
  // enquanto isso a pessoa marca uma como lida e a API devolve o número NOVO
  // (setUnreadCount). Se a resposta velha do polling chegar depois, ela
  // sobrescreveria o número novo com o velho. lastRefreshId numera cada
  // pergunta: só a resposta da ÚLTIMA pode escrever — e setUnreadCount também
  // sobe o número, o que torna "velha" qualquer pergunta que já estava no ar.
  let lastRefreshId = 0

  async function refresh() {
    const callId = ++lastRefreshId
    try {
      const response = await getUnreadCount()
      if (callId !== lastRefreshId) return
      unreadCount.value = response.data.unreadCount
    } catch {
      // Falhou (rede, API fora): mantém o último número. Nenhum toast: o
      // polling roda sozinho a cada 30 s, e um aviso a cada falha seria ruído.
    }
  }

  // Escrita vinda de quem SABE o número novo (a tela de Notificações).
  function setUnreadCount(value) {
    lastRefreshId++ // invalida qualquer refresh() que ainda esteja no ar
    unreadCount.value = Math.max(0, value)
  }

  // Aba escondida não pergunta: ninguém está olhando o sino, e dezenas de
  // abas esquecidas abertas multiplicariam as requisições à toa. Também é o
  // ouvinte de visibilitychange: ao VOLTAR para a aba, pergunta na hora.
  function refreshIfVisible() {
    if (document.visibilityState === 'visible') refresh()
  }

  function startPolling() {
    // Já ligado? Não liga outro. Sem isto, cada login (ou o watch disparando
    // de novo) criaria um setInterval a mais, e eles nunca seriam todos
    // desligados — 2, 3, 4 requisições a cada 30 s.
    if (timerId !== null) return
    refresh() // o número aparece logo ao entrar, sem esperar 30 s
    timerId = setInterval(refreshIfVisible, NOTIFICATIONS.POLL_MS)
    // A MESMA referência de função no add e no remove: removeEventListener
    // com uma função nova (ex.: uma arrow escrita de novo) não remove nada.
    document.addEventListener('visibilitychange', refreshIfVisible)
  }

  function stopPolling() {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
    document.removeEventListener('visibilitychange', refreshIfVisible)
    lastRefreshId++ // uma resposta que ainda chegue não reacende o número
    unreadCount.value = 0
  }

  return { unreadCount, refresh, setUnreadCount, refreshIfVisible, startPolling, stopPolling }
})
