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
    BIO_MAX: 255
  }
};
