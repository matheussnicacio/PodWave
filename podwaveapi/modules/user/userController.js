const userService = require('./userService');
const { success } = require('../../middlewares/apiResponse');

exports.register = async (req, res) => {
  const { username, email, password, fullName } = req.body;
  const newUser = await userService.registerUser(username, email, password, fullName);
  return success(res, newUser, 'Conta criada com sucesso! Faça login para continuar.', 201);
};

exports.getPublicProfile = async (req, res) => {
  const user = await userService.getPublicProfile(req.params.username);
  return success(res, user);
};
