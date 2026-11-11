module.exports = {
  VALIDATION: {
    USERNAME_MIN: 3,
    USERNAME_MAX: 20,
    PASSWORD_MIN: 6,
    // Específica para o campo `bio` (userModel.js define bio como
    // DataTypes.STRING(255)). Criada em vez de reaproveitar USERNAME_MAX ou
    // qualquer outra constante já existente: mesmo que dois campos aceitem
    // hoje o mesmo número, cada campo tem seu próprio significado e pode
    // mudar de tamanho de forma independente no futuro. Compartilhar uma
    // constante entre eles criaria uma dependência escondida — alterar o
    // limite de um campo (ex.: USERNAME_MAX) mudaria silenciosamente a
    // validação de outro (bio) sem nenhum aviso.
    BIO_MAX: 255,
    // Título do episódio (episodeModel.js define title como DataTypes.STRING,
    // limite padrão de 255 caracteres do próprio tipo — TITLE_MAX é mais
    // restritivo de propósito, para manter os títulos exibíveis em uma linha
    // nas telas de listagem).
    TITLE_MAX: 100,
    // Descrição do episódio (episodeModel.js define description como
    // DataTypes.STRING(500)). Mesmo raciocínio do BIO_MAX: constante própria,
    // não compartilhada com nenhum outro campo de texto longo.
    DESCRIPTION_MAX: 500,
    // Comentário (commentModel.js define content como DataTypes.STRING(500)).
    // Constante própria, pelo mesmo motivo de BIO_MAX: cada campo muda de
    // tamanho de forma independente.
    COMMENT_MAX: 500,
    // Aula 13 — playlists (a "coleção" do PodWave: o usuário junta episódios
    // de qualquer pessoa numa lista própria). Constantes próprias, pelo mesmo
    // motivo de BIO_MAX: o título da playlist não é o título do episódio.
    PLAYLIST_TITLE_MIN: 3,
    PLAYLIST_TITLE_MAX: 100,
    PLAYLIST_DESCRIPTION_MAX: 500
  },
  // Paginação dos feeds (GET /api/feed e GET /api/following-episodes).
  // Fonte ÚNICA do "tamanho de página": nenhum Service ou Controller escreve
  // 10, 12 ou 50 na mão — todos leem daqui (via utils/pagination.js).
  // MAX_LIMIT é o teto: evita que um cliente peça ?limit=100000 e force o
  // banco a devolver a tabela inteira.
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 12,
    MAX_LIMIT: 50
  },
  // Busca global (GET /api/search?q=). MIN_LENGTH evita consultar o banco
  // com 1 letra (devolveria quase tudo); MAX_LENGTH corta textos enormes
  // antes de virarem um LIKE caro; LIMIT é o teto de itens por lista.
  SEARCH: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    LIMIT: 10
  },
  // Aula 14 — notificações. Os tipos são as três ações que avisam alguém:
  // curtir e comentar (avisam o dono do episódio) e seguir (avisa quem foi
  // seguido). Fonte ÚNICA: o ENUM do model e os services leem daqui.
  NOTIFICATION: {
    TYPES: {
      LIKE: 'like',
      COMMENT: 'comment',
      FOLLOW: 'follow'
    }
  },
  // Aula 14 — denúncias. Os cinco motivos são FIXOS (os mesmos em todos os
  // projetos; a Aula 15 lê as denúncias com esta lista). O banco guarda a
  // CHAVE; o rótulo em português é coisa da tela (front).
  REPORT: {
    REASONS: ['inappropriate_content', 'harassment', 'spam', 'copyright', 'other'],
    // Aula 15 — situação da denúncia. Toda denúncia nasce 'pending' (o padrão
    // do model) e vira 'reviewed' quando um administrador a revisa. Fonte
    // ÚNICA: o ENUM do model e o service do painel leem daqui.
    STATUS: {
      PENDING: 'pending',
      REVIEWED: 'reviewed'
    }
  },
  // Aula 15 — painel de administração. Os filtros da lista de denúncias:
  // as duas situações e 'all' (sem filtro). O validator recusa qualquer outro
  // valor com 400; o front usa os MESMOS valores nos botões de filtro.
  ADMIN: {
    REPORT_FILTERS: ['pending', 'reviewed', 'all']
  }
};
