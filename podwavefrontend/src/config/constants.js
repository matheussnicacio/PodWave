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

// Aula 14 — notificações. POLL_MS: de quanto em quanto tempo o sino pergunta
// "quantas não lidas?". 30 s é um meio-termo: rápido o bastante para o aviso
// parecer "ao vivo", lento o bastante para não multiplicar requisições
// (cada pessoa logada faz 2 por minuto, não 60).
export const NOTIFICATIONS = {
  POLL_MS: 30000,
}

// Texto de cada tipo de aviso (as chaves são os valores do ENUM da API).
// A tela monta: "@usuario" + texto + (título do episódio, se houver).
export const NOTIFICATION_TEXT = {
  like: 'curtiu o seu episódio',
  comment: 'comentou no seu episódio',
  follow: 'começou a seguir você',
}

// Motivos de denúncia: a API e o banco guardam a CHAVE (value); a tela mostra
// o RÓTULO (label). Os cinco são fixos e nesta ordem (iguais a REPORT.REASONS
// da API). Se um rótulo mudar de texto, nenhum dado gravado muda junto.
export const REPORT_REASONS = [
  { value: 'inappropriate_content', label: 'Conteúdo impróprio' },
  { value: 'harassment', label: 'Assédio ou discurso de ódio' },
  { value: 'spam', label: 'Spam ou golpes' },
  { value: 'copyright', label: 'Violação de direitos autorais' },
  { value: 'other', label: 'Outro' },
]

// Aula 15 — filtros da lista de denúncias do painel. Os `value` são EXATAMENTE
// os de ADMIN.REPORT_FILTERS da API (pending | reviewed | all): é o que vai no
// ?status=. O `label` é só da tela.
export const REPORT_FILTERS = [
  { value: 'pending', label: 'Pendentes' },
  { value: 'reviewed', label: 'Revisadas' },
  { value: 'all', label: 'Todas' },
]
