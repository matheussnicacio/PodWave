const User = require('./userModel');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DEFAULT_PROFILE_PICTURE = 'default-profile.png';
const PROFILE_UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'profiles');

async function registerUser(username, email, password, fullName) {
  const emailExists = await User.findOne({ where: { email } });
  const usernameExists = await User.findOne({ where: { username } });

  if (emailExists || usernameExists) {
    throw new Error('Este e-mail ou usuário já está cadastrado.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
    fullName
  });

  return {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email
  };
}

async function getPublicProfile(username) {
  const user = await User.findOne({
    where: { username },
    attributes: ['id', 'username', 'fullName', 'bio', 'profilePicture', 'followersCount', 'followingCount', 'episodesCount']
  });

  if (!user) {
    const error = new Error('Usuário não encontrado.');
    error.status = 404;
    throw error;
  }

  return user;
}

async function loginUser(email, password) {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    // Mensagem genérica de propósito: não revela se o e-mail existe ou não.
    throw new Error('E-mail ou senha inválidos.');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new Error('E-mail ou senha inválidos.');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    isAdmin: user.isAdmin
  };
}

async function getUserProfile(userId) {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'username', 'email', 'fullName', 'bio', 'profilePicture', 'followersCount', 'followingCount', 'episodesCount', 'isAdmin']
  });

  if (!user) {
    const error = new Error('Usuário não encontrado.');
    error.status = 404;
    throw error;
  }

  return user;
}

async function updateUserProfile(userId, { fullName, bio, newProfilePictureFilename }) {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error('Usuário não encontrado.');
    error.status = 404;
    throw error;
  }

  user.fullName = fullName;
  // bio é opcional: string vazia/ausente limpa o campo, em vez de manter
  // um valor antigo escondido que o usuário achou que tinha apagado.
  user.bio = bio || null;

  if (newProfilePictureFilename) {
    const oldProfilePicture = user.profilePicture;

    user.profilePicture = newProfilePictureFilename;

    // Só apaga a foto antiga do disco se ela não for a padrão — apagar
    // default-profile.png derrubaria a foto de todo mundo que ainda não
    // enviou uma foto própria.
    if (oldProfilePicture && oldProfilePicture !== DEFAULT_PROFILE_PICTURE) {
      const oldFilePath = path.join(PROFILE_UPLOADS_DIR, oldProfilePicture);
      fs.unlink(oldFilePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Erro ao remover foto de perfil antiga:', err);
        }
      });
    }
  }

  await user.save();

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    bio: user.bio,
    profilePicture: user.profilePicture,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    episodesCount: user.episodesCount,
    isAdmin: user.isAdmin
  };
}

module.exports = { registerUser, getPublicProfile, loginUser, getUserProfile, updateUserProfile };
