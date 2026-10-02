// Monta a URL completa de arquivos servidos estaticamente pela API
// (por enquanto, só fotos de perfil).
//
// Por que não reaproveitar VITE_API_URL? Porque VITE_API_URL aponta para a
// raiz da API REST (ex.: http://localhost:4000/api), e o Express serve os
// uploads FORA desse prefixo (app.use('/uploads', express.static(...)),
// montado em app.js antes de app.use('/api', ...)). Usar VITE_API_URL aqui
// geraria .../api/uploads/profiles/foo.jpg, que não existe. Por isso existe
// uma variável de ambiente própria, VITE_UPLOADS_URL, apontando para a raiz
// do servidor (sem o /api).
const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_URL

/**
 * Devolve a URL pública completa da foto de perfil de um usuário.
 * Se nenhum filename for passado, cai na foto padrão (mesmo default-profile.png
 * salvo em disco pelo backend), então a tela nunca fica sem imagem para exibir.
 */
export function getProfilePictureUrl(filename) {
  const safeFilename = filename || 'default-profile.png'
  return `${UPLOADS_BASE_URL}/uploads/profiles/${safeFilename}`
}

/**
 * URL pública do ÁUDIO de um episódio (arquivo estático em
 * /uploads/episodes/audio/...), usada no src do <audio>.
 *
 * Por que NÃO apontar para GET /api/episodes/:id/stream: uma tag <audio>
 * (como <video> e <img>) faz a requisição sozinha, pelo navegador, e não há
 * como mandar nela o cabeçalho "Authorization: Bearer ...". A rota /stream é
 * protegida por isAuthenticated, então o <audio> receberia 401 e nunca
 * tocaria. O caminho estático é público (express.static, sem auth) e já
 * suporta Range (206), então o seek funciona sem a rota /stream. A rota
 * /stream existe e funciona (vide testes com curl + token), mas fica fora do
 * player — a inconsistência de arquitetura discutida no roteiro da Shortz-App.
 */
export function getEpisodeAudioUrl(filename) {
  return `${UPLOADS_BASE_URL}/uploads/episodes/audio/${filename}`
}

/**
 * URL pública da CAPA de um episódio (/uploads/episodes/covers/...).
 * Usada no card do Feed (em miniatura, via CSS) e no detalhe (maior).
 */
export function getEpisodeCoverUrl(filename) {
  return `${UPLOADS_BASE_URL}/uploads/episodes/covers/${filename}`
}
