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
