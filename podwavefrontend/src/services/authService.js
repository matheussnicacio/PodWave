import api from './api'

export function register(payload) {
  // silent: o erro de cadastro aparece no FORMULÁRIO, não em toast.
  // post(url, DADOS, CONFIG): a config é o 3º argumento.
  return api.post('/register', payload, { silent: true })
}

export function login(payload) {
  return api.post('/login', payload, { silent: true })
}

export function logout() {
  // silent: o logout é best-effort (a store encerra a sessão local mesmo se
  // falhar). O 2º argumento é o CORPO: precisa ocupar o lugar para a config
  // ir no 3º, mas com `undefined` (sem corpo), e NÃO `null`.
  //
  // Aula 14: com `null`, o Axios enviava o texto "null" com Content-Type
  // application/json. O express.json() (modo strict) recusa um JSON que não é
  // objeto/array -> 400. E como o cors vinha DEPOIS do express.json() no
  // app.js, esse 400 saía sem Access-Control-Allow-Origin, e o Console
  // mostrava um "erro de CORS" vermelho a cada logout.
  return api.post('/logout', undefined, { silent: true })
}

export function getMyProfile() {
  return api.get('/profile/me')
}

// Única chamada de toda a aplicação que sobrescreve o Content-Type padrão
// da instância do Axios (api.js continua com 'application/json' para todo
// o resto). PUT /profile/me aceita multipart/form-data porque o corpo pode
// incluir um arquivo (a foto de perfil), e um arquivo não cabe, na prática,
// dentro de um JSON: JSON só representa texto/números/booleanos/listas/
// objetos, tudo em UTF-8 — não existe um jeito nativo de colocar bytes
// binários arbitrários (o conteúdo de uma imagem) num campo de string sem
// primeiro converter esses bytes para texto (ex.: base64), o que infla o
// tamanho do arquivo em ~33% e ainda exige codificar/decodificar dos dois
// lados. multipart/form-data resolve isso enviando cada campo como uma
// "parte" separada dentro do mesmo corpo da requisição, delimitada
// por um "boundary": campos de texto (fullName, bio) vão como texto puro, e
// o arquivo vai com seus bytes originais, sem nenhuma conversão.
//
// Passar um FormData como body para o Axios com header
// 'Content-Type': 'multipart/form-data' faz o navegador (não o Axios)
// calcular e anexar o boundary sozinho ao cabeçalho de fato enviado.
export function updateProfile(formData) {
  return api.put('/profile/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    silent: true, // erro de edição de perfil é do formulário
  })
}

// Perfil público de qualquer usuário, pelo username. A rota da API é pública
// (optionalAuth): o interceptor anexa o token quando existe, e a API usa isso
// só para calcular isOwner.
export function getPublicProfile(username) {
  return api.get(`/profile/${encodeURIComponent(username)}`)
}
