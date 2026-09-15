const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Duas pastas separadas (não uma pasta "episodes" única com os dois tipos
// misturados): áudio e capa são conteúdos de natureza bem diferente
// (binário de mídia longo vs. imagem pequena), e mantê-los em subpastas
// próprias facilita, por exemplo, apontar um backup ou uma política de
// tamanho diferente para cada um no futuro.
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'uploads', 'episodes', 'audio');
const COVERS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'episodes', 'covers');

for (const dir of [AUDIO_DIR, COVERS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// multer.fields([...]), não multer.single(...): o formulário de envio de
// episódio manda DOIS arquivos ao mesmo tempo, cada um com seu próprio nome
// de campo no multipart/form-data ("audio" e "cover"). multer.single('x')
// só sabe lidar com um único campo de arquivo por requisição — usá-lo aqui
// faria o multer aceitar só o primeiro arquivo enviado e ignorar (ou
// rejeitar, dependendo da ordem) o segundo. multer.fields([...]) processa
// vários campos de arquivo distintos na mesma requisição, cada um
// disponível depois em req.files.audio[0] / req.files.cover[0] — em vez de
// req.file (singular) que multer.single(...) popula.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destination = file.fieldname === 'audio' ? AUDIO_DIR : COVERS_DIR;
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const ALLOWED_AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/mp3'];
const ALLOWED_COVER_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function fileFilter(req, file, cb) {
  if (file.fieldname === 'audio') {
    if (!ALLOWED_AUDIO_MIME_TYPES.includes(file.mimetype)) {
      const error = new Error('Formato de áudio inválido. Envie um arquivo MP3.');
      error.status = 400;
      return cb(error);
    }
    return cb(null, true);
  }

  if (file.fieldname === 'cover') {
    if (!ALLOWED_COVER_MIME_TYPES.includes(file.mimetype)) {
      const error = new Error('Formato de imagem inválido. Envie um arquivo JPEG, PNG ou WEBP para a capa.');
      error.status = 400;
      return cb(error);
    }
    return cb(null, true);
  }

  // Campo de arquivo que não é nem "audio" nem "cover": rejeita, em vez de
  // aceitar silenciosamente algo fora do contrato esperado pela rota.
  const error = new Error('Campo de arquivo inesperado.');
  error.status = 400;
  return cb(error);
}

const episodeMulter = multer({
  storage,
  fileFilter,
  // Um único `limits` vale para os dois campos (multer não permite limites
  // por campo dentro de fields([...])). 50MB cobre um episódio de áudio
  // razoável sem deixar a capa (bem menor, na prática) perto do limite.
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

module.exports = episodeMulter;
