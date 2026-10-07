const fs = require('fs');
const { error } = require('./apiResponse');

// Junta todos os arquivos que o multer já gravou em disco nesta requisição.
// req.file  -> multer.single(...)
// req.files -> multer.fields([...]) (objeto de arrays) ou multer.array(...) (array)
function collectUploadedFiles(req) {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === 'object') {
    for (const list of Object.values(req.files)) files.push(...list);
  }
  return files;
}

// Arquivo órfão: está no disco, mas nenhum registro do banco aponta para ele.
// O multer grava o arquivo ANTES de auth/validador/controller terminarem;
// se qualquer um deles falhar (403, 400, 404...), o arquivo ficaria para
// sempre na pasta. Como todo erro passa por aqui, é aqui que limpamos.
function removeOrphanFiles(req) {
  for (const file of collectUploadedFiles(req)) {
    if (!file.path) continue;
    fs.unlink(file.path, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Erro ao remover arquivo órfão:', file.path, err);
      }
    });
  }
}

module.exports = (err, req, res, next) => {
  console.error(err);

  removeOrphanFiles(req);

  // Erros do multer (arquivo grande demais, campo de arquivo inesperado etc.)
  // chegam com err.name === 'MulterError', sem err.status definido. Sem este
  // tratamento, cairiam no 500 genérico do fallback abaixo.
  const statusCode = err.status || (err.name === 'MulterError' ? 400 : 500);
  const errors = err.errors || [];
  return error(res, err.message || 'Ocorreu um erro inesperado.', statusCode, errors);
};
