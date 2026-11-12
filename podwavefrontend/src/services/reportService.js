import api from './api'

// Denunciar um episódio. `reason` é a CHAVE do motivo (ex.: 'spam'), nunca o
// rótulo. silent: true no 3º argumento (a CONFIG do post): o erro da
// denúncia (409 "você já denunciou", rede...) aparece DENTRO do modal.
export function reportEpisode(episodeId, reason) {
  return api.post(`/episodes/${episodeId}/report`, { reason }, { silent: true })
}
