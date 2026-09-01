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

import axios from 'axios'
import router from '../router'
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../utils/storageKeys'

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
// store (useAuthStore) e chamar useAuthStore().token. Isso evita uma
// dependência circular: a store de auth (stores/auth.js) importa o
// authService, que importa este arquivo (api.js) para montar as chamadas.
// Se este arquivo também importasse a store para ler o token, formaria um
// ciclo store -> service -> api -> store, que o bundler nem sempre resolve
// de forma previsível. Lendo direto do localStorage, api.js não depende de
// nada relacionado ao Pinia — só importa o nome da chave de um módulo
// neutro (utils/storageKeys.js), que por sua vez não importa nada.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // A API respondeu, mas com um status de erro (4xx ou 5xx)
      const apiError = error.response.data

      if (error.response.status === 401) {
        // Sessão inválida ou expirada: limpa os dados salvos e manda o
        // usuário de volta para o Login, guardando a rota atual em
        // ?redirect=... para devolvê-lo para onde estava depois de logar de novo.
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        localStorage.removeItem(USER_STORAGE_KEY)

        const currentRoute = router.currentRoute.value
        if (currentRoute.name !== 'login') {
          router.push({ name: 'login', query: { redirect: currentRoute.fullPath } })
        }
      }

      return Promise.reject({
        message: apiError.message || 'Ocorreu um erro na requisição.',
        errors: apiError.errors || [],
        status: error.response.status,
      })
    } else if (error.request) {
      // A requisição foi enviada, mas nenhuma resposta chegou (API fora do ar, sem rede)
      return Promise.reject({
        message: 'Não foi possível se conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.',
        errors: [],
        status: null,
      })
    } else {
      // Erro ao montar a própria requisição (configuração inválida, por exemplo)
      return Promise.reject({
        message: 'Erro inesperado ao preparar a requisição.',
        errors: [],
        status: null,
      })
    }
  }
)

export default api
