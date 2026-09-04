import api from './api'

export function register(payload) {
  return api.post('/register', payload)
}

export function login(payload) {
  return api.post('/login', payload)
}

export function logout() {
  return api.post('/logout')
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
  })
}
