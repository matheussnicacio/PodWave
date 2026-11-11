// Constantes do frontend. Este arquivo NÃO importa nada (nem Pinia, nem
// services): api.js e stores/auth.js dependem dele, e um módulo neutro evita
// dependência circular (store -> service -> api -> store).
//
// Os LIMITS precisam combinar com podwaveapi/config/constants.js (VALIDATION
// e PAGINATION): o front valida para dar resposta rápida, mas quem decide de
// verdade é a API.

// Chaves do localStorage (sessão).
export const STORAGE_KEYS = {
  TOKEN: 'podwave_token',
  USER: 'podwave_user',
}

// Limites de validação dos formulários (espelham VALIDATION da API).
export const LIMITS = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  PASSWORD_MIN: 6,
  BIO_MAX: 255,
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 500,
  COMMENT_MAX: 500,
  // Aula 13 — playlists (iguais a VALIDATION.PLAYLIST_* da API).
  PLAYLIST_TITLE_MIN: 3,
  PLAYLIST_TITLE_MAX: 100,
  PLAYLIST_DESCRIPTION_MAX: 500,
}

// Busca (Aula 13). MIN_LENGTH igual ao SEARCH.MIN_LENGTH da API: abaixo disso
// a tela nem chama a API. DEBOUNCE_MS: quanto tempo sem digitar conta como
// "a pessoa terminou o termo" — uma requisição por pausa, não por tecla.
export const SEARCH = {
  MIN_LENGTH: 2,
  DEBOUNCE_MS: 400,
}

// Tamanho de página dos feeds. Igual ao PAGINATION.DEFAULT_LIMIT da API e
// sempre <= PAGINATION.MAX_LIMIT (a API recusa mais que isso).
export const PAGE_SIZE = 12

// Quanto tempo (ms) cada tipo de toast fica na tela.
export const TOAST_DURATION = {
  SUCCESS: 3000,
  INFO: 4000,
  ERROR: 6000,
}

// Mensagens padrão (usadas quando a API não manda uma).
export const MESSAGES = {
  GENERIC_ERROR: 'Ocorreu um erro na requisição.',
  NETWORK_ERROR: 'Não foi possível se conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.',
  REQUEST_SETUP_ERROR: 'Erro inesperado ao preparar a requisição.',
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente para continuar.',
  LOAD_ERROR: 'Não foi possível carregar os dados.',
}
