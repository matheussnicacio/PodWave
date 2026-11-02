// Comentário explicando os três ramos do interceptor de resposta abaixo:
//
// 1) Sucesso (response) => response.data:
//    "descasca" um nível da resposta do Axios. Sem isso, toda chamada
//    precisaria escrever response.data.data para chegar no conteúdo real;
//    com o interceptor, cada service recebe diretamente o envelope da API
//    ({ success, message, data }), pronto para uso.
//
// 2) error.response:
//    a requisição chegou até a API e ela respondeu, só que com um status
//    de erro (400, 401, 404, 500...). O corpo dessa resposta já vem no
//    formato { success, message, errors } (o mesmo helper `error` do
//    apiResponse.js do back-end), então só precisamos reaproveitá-lo.
//
// 3) error.request:
//    a requisição foi enviada pelo navegador, mas nenhuma resposta chegou
//    de volta — API fora do ar, sem conexão de rede, timeout, etc. Como
//    não existe error.response.data para ler nesse caso, devolvemos uma
//    mensagem genérica e amigável em vez de um erro técnico do Axios.
//
// (else) qualquer outro erro:
//    acontece antes mesmo da requisição sair — um erro de configuração ao
//    montar a chamada. É o caso mais raro dos três.
//
// Em todos os ramos o resultado final é sempre um Promise.reject no mesmo
// formato { message, errors, status }, para que cada tela trate erro do
// mesmo jeito, sem precisar saber qual dos três casos aconteceu.
//
// QUEM AVISA O USUÁRIO QUANDO ALGO FALHA (Atividade 12):
//  - AÇÃO que falha (curtir, seguir, excluir...: tudo que não é GET) -> TOAST,
//    disparado aqui por notifyIfNeeded, salvo se a chamada tiver `silent: true`;
//  - LEITURA que falha (GET) -> é da TELA (useAsyncData.error, no lugar do
//    conteúdo, com "Tentar de novo"); toast aqui seria ruído duplicado;
//  - FORMULÁRIO que falha -> é do formulário (erro no próprio form, junto dos
//    campos); por isso os services de formulário passam `silent: true`;
//  - 401 -> limpa a sessão e leva ao login (com aviso de sessão expirada).
// "Toast para todo erro" seria erro de design: o mesmo erro apareceria duas
// vezes (toast + tela) e erros de formulário, que pedem correção de um campo,
// sumiriam em 6 segundos.
//
// ATENÇÃO ao Axios: `silent` vai dentro do objeto de CONFIG, que é o 2º
// argumento em get/delete (api.get(url, config)) e o 3º em post/put
// (api.post(url, data, config)). Passar { silent: true } como 2º argumento de
// um post vira o CORPO da requisição, não a config.

import axios from 'axios'
import router from '../router'
import { MESSAGES, STORAGE_KEYS } from '../config/constants'
import { useToast } from '../composables/useToast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de REQUISIÇÃO: anexa o Authorization em toda chamada, se
// existir um token salvo.
//
// O token é lido diretamente do localStorage aqui, em vez de importar a
// store (useAuthStore): evita a dependência circular store -> service -> api
// -> store. api.js só depende de módulos neutros (config/constants e o
// singleton useToast), que não importam a store.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Toast só para AÇÃO (método diferente de GET) que não pediu silêncio.
// O 401 tem tratamento próprio (redirecionamento) e nunca gera este toast.
function notifyIfNeeded(error, apiError) {
  const config = error.config || {}
  const isRead = (config.method || 'get').toLowerCase() === 'get'
  if (isRead || config.silent) return
  useToast().error(apiError.message)
}

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let apiError

    if (error.response) {
      // A API respondeu, mas com um status de erro (4xx ou 5xx)
      const data = error.response.data || {}
      apiError = {
        message: data.message || MESSAGES.GENERIC_ERROR,
        errors: data.errors || [],
        status: error.response.status,
      }

      if (error.response.status === 401) {
        // Sessão inválida ou expirada: limpa os dados salvos e manda o
        // usuário de volta para o Login, guardando a rota atual em
        // ?redirect=... para devolvê-lo para onde estava depois de logar de novo.
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)

        const currentRoute = router.currentRoute.value
        if (currentRoute.name !== 'login') {
          useToast().info(MESSAGES.SESSION_EXPIRED)
          router.push({ name: 'login', query: { redirect: currentRoute.fullPath } })
        }
        return Promise.reject(apiError)
      }
    } else if (error.request) {
      // A requisição foi enviada, mas nenhuma resposta chegou (API fora do ar, sem rede)
      apiError = { message: MESSAGES.NETWORK_ERROR, errors: [], status: null }
    } else {
      // Erro ao montar a própria requisição (configuração inválida, por exemplo)
      apiError = { message: MESSAGES.REQUEST_SETUP_ERROR, errors: [], status: null }
    }

    notifyIfNeeded(error, apiError)
    return Promise.reject(apiError)
  }
)

export default api
