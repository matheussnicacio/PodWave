const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pasta física onde as fotos de perfil ficam salvas em disco. É a mesma
// pasta que app.js expõe publicamente via express.static, então qualquer
// arquivo salvo aqui já fica acessível em /uploads/profiles/<arquivo>.
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'profiles');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// multipart/form-data não cabe em memória do jeito que express.json() lê
// um corpo JSON de uma vez só: o multer faz o parsing desse formato e,
// com diskStorage, grava o arquivo direto em disco, em streaming, sem
// segurar o arquivo inteiro na RAM do processo Node.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Nome único por upload, para nunca sobrescrever a foto de outro
    // usuário (ou uma foto antiga do mesmo usuário) por coincidência de nome.
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const error = new Error('Formato de imagem inválido. Envie um arquivo JPEG, PNG ou WEBP.');
    error.status = 400;
    return cb(error);
  }
  return cb(null, true);
}

const profileMulter = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = profileMulter;
