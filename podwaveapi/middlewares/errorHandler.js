const { error } = require('./apiResponse');

module.exports = (err, req, res, next) => {
  console.error(err);

  // Erros do multer (arquivo grande demais, campo de arquivo inesperado etc.)
  // chegam com err.name === 'MulterError', sem err.status definido. Sem este
  // tratamento, cairiam no 500 genérico do fallback abaixo.
  const statusCode = err.status || (err.name === 'MulterError' ? 400 : 500);
  const errors = err.errors || [];
  return error(res, err.message || 'Ocorreu um erro inesperado.', statusCode, errors);
};
