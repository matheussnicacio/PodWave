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
    DESCRIPTION_MAX: 500
  }
};
