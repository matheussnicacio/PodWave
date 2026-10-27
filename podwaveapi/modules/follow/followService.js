const { UniqueConstraintError, Op } = require('sequelize');
const sequelize = require('../../config/database');
const Follow = require('./followModel');
const User = require('../user/userModel');

// Só colunas públicas: password e email nunca entram nesta lista, então nunca
// saem do banco.
const PUBLIC_USER_ATTRIBUTES = ['id', 'username', 'fullName', 'bio', 'profilePicture'];

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function userNotFound() {
  return httpError('Usuário não encontrado.', 404);
}

async function assertUserExists(userId) {
  const user = await User.findByPk(userId, { attributes: ['id'] });
  if (!user) {
    throw userNotFound();
  }
}

/**
 * Alterna "followerId segue followingId".
 *
 * Ordem dos parâmetros: (followerId, followingId) — QUEM SEGUE primeiro, QUEM
 * É SEGUIDO depois. São dois números e a troca não gera erro nenhum: só deixa
 * o contador errado na pessoa errada.
 *
 * ATENÇÃO — os dois ids PRECISAM chegar como NÚMERO. followerId vem do JWT
 * (número); followingId vem de req.params (string). Se o controller não
 * converter, `"5" === 5` é false e a pessoa consegue seguir a si mesma sem
 * erro algum. A conversão acontece na borda (parseUserId do controller); aqui
 * dentro o service confia no tipo.
 *
 * Três escritas na MESMA transação (todas com { transaction: t }):
 *   1) a linha em `follows` (criada ou removida);
 *   2) users.followers_count do SEGUIDO  (sobe/desce em quem RECEBE o seguidor);
 *   3) users.following_count de QUEM SEGUE (sobe/desce em quem FAZ a ação).
 *
 * @returns {{ isFollowing: boolean, followersCount: number }} — o contador de
 * seguidores do ALVO depois da operação (é o número que o perfil exibe).
 */
async function toggleFollow(followerId, followingId) {
  // 1) Validações baratas primeiro, sem tocar no banco.
  if (followerId === followingId) {
    throw httpError('Você não pode seguir a si mesmo.', 400);
  }

  // 2) O alvo existe?
  await assertUserExists(followingId);

  try {
    return await sequelize.transaction(async (t) => {
      // Trava as DUAS linhas de usuário (SELECT ... FOR UPDATE) em ordem
      // crescente de id. Duas razões:
      //  - sem a trava, cliques simultâneos do mesmo par leriam todos "já
      //    segue", todos decrementariam, só um DELETE removeria a linha e o
      //    contador ficaria negativo (o mesmo bug visto no toggleLike);
      //  - a ORDEM fixa (sempre o menor id primeiro) evita deadlock quando A
      //    segue B ao mesmo tempo em que B segue A: ninguém espera pelo outro
      //    em ordem inversa.
      await User.findAll({
        attributes: ['id'],
        where: { id: { [Op.in]: [followerId, followingId] } },
        order: [['id', 'ASC']],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      const [follow, created] = await Follow.findOrCreate({
        where: { followerId, followingId },
        defaults: { followerId, followingId },
        transaction: t
      });

      let isFollowing;

      if (created) {
        // Passou a seguir: +1 seguidor no seguido, +1 "seguindo" em quem seguiu.
        await User.increment('followersCount', { by: 1, where: { id: followingId }, transaction: t });
        await User.increment('followingCount', { by: 1, where: { id: followerId }, transaction: t });
        isFollowing = true;
      } else {
        const removed = await Follow.destroy({ where: { id: follow.id }, transaction: t });
        if (removed !== 1) {
          // Rede de segurança: se a linha já não existia, NÃO mexe nos contadores.
          throw new UniqueConstraintError({ message: 'Seguimento já alterado por outra requisição.' });
        }
        await User.decrement('followersCount', { by: 1, where: { id: followingId }, transaction: t });
        await User.decrement('followingCount', { by: 1, where: { id: followerId }, transaction: t });
        isFollowing = false;
      }

      // reload() do alvo DENTRO da transação: devolve o valor real, depois do
      // incremento/decremento, e não um número calculado em memória.
      const target = await User.findByPk(followingId, { attributes: ['id', 'followersCount'], transaction: t });
      await target.reload({ transaction: t });

      return { isFollowing, followersCount: target.followersCount };
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw httpError('Seguimento já registrado. Tente novamente.', 409);
    }
    throw err;
  }
}

/**
 * "viewerId segue targetId?" — booleano. Visitante (viewerId undefined) ou o
 * próprio dono do perfil: sempre false.
 */
async function getFollowStatus(viewerId, targetId) {
  await assertUserExists(targetId);

  if (viewerId === undefined || viewerId === targetId) {
    return false;
  }

  const follow = await Follow.findOne({
    where: { followerId: viewerId, followingId: targetId },
    attributes: ['id']
  });
  return follow !== null;
}

/**
 * Quem SEGUE `userId` -> linhas com followingId = userId; a pessoa que
 * interessa é o Follower. Mais recente primeiro.
 */
async function getFollowers(userId) {
  await assertUserExists(userId);

  const rows = await Follow.findAll({
    where: { followingId: userId },
    include: [{ model: User, as: 'Follower', attributes: PUBLIC_USER_ATTRIBUTES }],
    order: [['createdAt', 'DESC'], ['id', 'DESC']]
  });

  return rows.map((row) => row.Follower);
}

/**
 * Quem `userId` SEGUE -> linhas com followerId = userId; a pessoa que
 * interessa é o Following. Mais recente primeiro.
 */
async function getFollowing(userId) {
  await assertUserExists(userId);

  const rows = await Follow.findAll({
    where: { followerId: userId },
    include: [{ model: User, as: 'Following', attributes: PUBLIC_USER_ATTRIBUTES }],
    order: [['createdAt', 'DESC'], ['id', 'DESC']]
  });

  return rows.map((row) => row.Following);
}

module.exports = { toggleFollow, getFollowStatus, getFollowers, getFollowing };
