const sequelize = require('../../config/database');
const { UniqueConstraintError } = require('sequelize');
const Like = require('./likeModel');
const Episode = require('../episode/episodeModel');
const User = require('../user/userModel');

function notFound() {
  const error = new Error('Episódio não encontrado.');
  error.status = 404;
  return error;
}

// Id que não é um inteiro positivo nunca vai existir: 404 direto, sem
// consultar o banco (mesmo padrão do episodeService).
function assertValidId(episodeId) {
  if (!/^\d+$/.test(String(episodeId))) {
    throw notFound();
  }
}

/**
 * Alterna a curtida de `userId` no episódio `episodeId`.
 *
 * Escrita DUPLA (linha em `likes` + contador em `episodes.likes_count`): as
 * duas coisas precisam acontecer juntas ou nenhuma. Por isso ficam dentro de
 * sequelize.transaction. ATENÇÃO: todo comando dentro da transação recebe
 * { transaction: t }. Sem isso, o comando esquecido roda FORA da transação,
 * em outra conexão — não é desfeito por um rollback e nem enxerga o que a
 * transação ainda não confirmou (commit). Não dá erro nenhum: só deixa
 * linha e contador divergentes.
 *
 * Ordem dos parâmetros: (userId, episodeId) — nunca troque, são ambos números
 * e a troca não gera erro, só dados trocados.
 *
 * @returns {{ liked: boolean, likesCount: number }}
 */
async function toggleLike(userId, episodeId) {
  assertValidId(episodeId);

  try {
    return await sequelize.transaction(async (t) => {
      // lock: t.LOCK.UPDATE (SELECT ... FOR UPDATE) trava a linha do episódio
      // até o fim da transação: curtidas simultâneas do MESMO episódio passam
      // a ser processadas uma de cada vez. Sem a trava, N cliques rápidos
      // leriam todos "já curtiu", todos decrementariam o contador, mas só um
      // DELETE removeria a linha — o contador ficaria negativo (testado: -2).
      const episode = await Episode.findByPk(episodeId, {
        attributes: ['id'],
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (!episode) {
        throw notFound();
      }

      const existing = await Like.findOne({ where: { userId, episodeId }, transaction: t });
      let liked;

      if (existing) {
        const removed = await Like.destroy({ where: { id: existing.id }, transaction: t });
        if (removed !== 1) {
          // Rede de segurança: se a linha já não existia, NÃO mexe no contador.
          throw new UniqueConstraintError({ message: 'Curtida já alterada por outra requisição.' });
        }
        await Episode.decrement('likesCount', { by: 1, where: { id: episodeId }, transaction: t });
        liked = false;
      } else {
        await Like.create({ userId, episodeId }, { transaction: t });
        await Episode.increment('likesCount', { by: 1, where: { id: episodeId }, transaction: t });
        liked = true;
      }

      // Lê o contador DENTRO da transação: devolve o valor real depois do
      // incremento/decremento, não um número calculado em memória.
      const fresh = await Episode.findByPk(episodeId, { attributes: ['likesCount'], transaction: t });
      return { liked, likesCount: fresh.likesCount };
    });
  } catch (err) {
    // Duas requisições simultâneas do mesmo usuário: a segunda bate no índice
    // único e a transação inteira volta atrás. O banco protegeu os dados;
    // aqui só traduzimos o erro para algo que o cliente entenda.
    if (err instanceof UniqueConstraintError) {
      const conflict = new Error('Curtida já registrada. Tente novamente.');
      conflict.status = 409;
      throw conflict;
    }
    throw err;
  }
}

/**
 * Estado da curtida para quem pede. `viewerId` é undefined para visitante
 * (optionalAuth): liked é sempre false nesse caso, mas likesCount continua
 * sendo devolvido.
 */
async function getLikeStatus(viewerId, episodeId) {
  assertValidId(episodeId);

  const episode = await Episode.findByPk(episodeId, { attributes: ['id', 'likesCount'] });
  if (!episode) {
    throw notFound();
  }

  let liked = false;
  if (viewerId !== undefined) {
    const like = await Like.findOne({ where: { userId: viewerId, episodeId }, attributes: ['id'] });
    liked = like !== null;
  }

  return { liked, likesCount: episode.likesCount };
}

/**
 * Episódios que o usuário curtiu, do curtido mais recentemente para o mais
 * antigo, cada um com o autor (só colunas públicas).
 */
async function getLikedEpisodes(userId) {
  const likes = await Like.findAll({
    where: { userId },
    include: [
      {
        model: Episode,
        as: 'episode',
        required: true,
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'profilePicture'] }
        ]
      }
    ],
    order: [['createdAt', 'DESC'], ['id', 'DESC']]
  });

  return likes.map((like) => like.episode);
}

module.exports = { toggleLike, getLikeStatus, getLikedEpisodes };
