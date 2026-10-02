import api from './api'

// onUploadProgress, não hard-coded aqui dentro: quem decide o QUE fazer com
// o progresso (atualizar uma barra, um texto, nada) é a tela que chama este
// service, não o service em si. O Axios chama essa função repetidas vezes
// durante o envio, cada vez com um ProgressEvent — este service só repassa
// a callback adiante, sem saber (nem precisar saber) o que a tela faz com ela.
export function createEpisode(formData, onUploadProgress) {
  return api.post('/episodes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
}

// Detalhe de um episódio (rota pública no back-end, com optionalAuth: o
// interceptor do api.js anexa o token quando existe, e o back-end usa isso
// só para calcular isOwner).
export function getEpisodeById(id) {
  return api.get(`/episodes/${id}`)
}

// Uma página do Feed geral. A API devolve um array em data; array vazio = não
// há mais itens.
export function getFeed(page = 1, limit = 8) {
  return api.get('/feed', { params: { page, limit } })
}
