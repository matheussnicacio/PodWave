const userService = require('./userService');
const { success } = require('../../middlewares/apiResponse');
const { generateToken } = require('../../config/jwt');

exports.register = async (req, res) => {
  const { username, email, password, fullName } = req.body;
  const newUser = await userService.registerUser(username, email, password, fullName);
  return success(res, newUser, 'Conta criada com sucesso! Faça login para continuar.', 201);
};

exports.getPublicProfile = async (req, res) => {
  const user = await userService.getPublicProfile(req.params.username);
  return success(res, user);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await userService.loginUser(email, password);

  // Payload do JWT: só o essencial para identificar o usuário nas próximas
  // requisições. Nunca vai senha (nem hash) ou qualquer outro dado sensível aqui,
  // porque o payload é apenas codificado em Base64, não criptografado — qualquer
  // um consegue decodificá-lo e ler o conteúdo, mesmo sem a chave secreta.
  const token = generateToken({ id: user.id, username: user.username, isAdmin: user.isAdmin });

  return success(res, { token, user }, 'Login realizado com sucesso.');
};

exports.logout = async (req, res) => {
  // Em um esquema JWT stateless, o servidor não guarda sessão nenhuma para
  // revogar: o token continua válido até expirar sozinho. Esse endpoint existe
  // só para manter uma convenção de API (e permitir que o front sempre tenha uma
  // chamada de "logout" para disparar), mas quem realmente encerra a sessão é o
  // front-end, descartando o token guardado localmente.
  return success(res, null, 'Logout realizado com sucesso.');
};

exports.getMyProfile = async (req, res) => {
  const user = await userService.getUserProfile(req.user.id);
  return success(res, user);
};

exports.updateProfile = async (req, res) => {
  const { fullName, bio } = req.body;
  // req.file só existe quando o campo "profilePicture" veio preenchido no
  // multipart/form-data (o multer.single('profilePicture') que popula
  // isso). Sem foto nova, req.file é undefined e a foto atual é mantida.
  const newProfilePictureFilename = req.file ? req.file.filename : undefined;

  const updatedUser = await userService.updateUserProfile(req.user.id, {
    fullName,
    bio,
    newProfilePictureFilename
  });

  return success(res, updatedUser, 'Perfil atualizado com sucesso.');
};
