const { UniqueConstraintError } = require('sequelize');
const sequelize = require('../../config/database');
const Playlist = require('./playlistModel');
const PlaylistEpisode = require('./playlistEpisodeModel');
const Episode = require('../episode/episodeModel');
const User = require('../user/userModel');

// Só colunas PÚBLICAS do usuário (nunca password, email, isAdmin...).
const PUBLIC_USER_ATTRIBUTES = ['id', 'username', 'fullName', 'profilePicture'];

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

const playlistNotFound = () => httpError('Playlist não encontrada.', 404);
const episodeNotFound = () => httpError('Episódio não encontrado.', 404);

/**
 * A playlist, desde que exista (404) E seja de `userId` (403) — nessa ordem.
 * Usada por adicionar, remover e excluir: só a dona escreve na playlist.
 *
 * Ordem 404 -> 403: primeiro "existe?", depois "é sua?". O 400 (id inválido)
 * já foi tratado antes, no controller, pelo parseId.
 */
async function findOwnedPlaylistOrFail(playlistId, userId, options = {}) {
  const playlist = await Playlist.findByPk(playlistId, options);
  if (!playlist) {
    throw playlistNotFound();
  }
  if (playlist.userId !== userId) {
    throw httpError('Você não tem permissão para alterar esta playlist.', 403);
  }
  return playlist;
}

/**
 * Cria a playlist. `isPublic === true` (e não Boolean(isPublic)): só o
 * booleano true torna a playlist pública. Boolean("false") é true — com ele,
 * um texto "false" viraria uma playlist pública. O validator já recusa o que
 * não é booleano; esta comparação é a segunda camada de defesa.
 */
async function createPlaylist(userId, { title, description, isPublic }) {
  const playlist = await Playlist.create({
    title,
    description: description || null,
    isPublic: isPublic === true,
    userId
  });
  return playlist;
}

/**
 * As playlists de `userId`, da mais nova para a mais antiga.
 * Desempate por id: createdAt tem precisão de SEGUNDOS no MySQL; duas
 * playlists criadas no mesmo segundo teriam a mesma data e a ordem entre elas
 * ficaria a critério do banco (podendo mudar de uma consulta para outra).
 */
async function getUserPlaylists(userId) {
  return Playlist.findAll({
    where: { userId },
    order: [['createdAt', 'DESC'], ['id', 'DESC']]
  });
}

/**
 * Detalhe de uma playlist, respeitando isPublic.
 *
 * `currentUserId` é null para visitante (o controller passa req.user?.id ?? null).
 * isOwner checa `currentUserId !== null` PRIMEIRO: sem isso, uma comparação
 * descuidada entre "ninguém" (null/undefined) e um valor ausente poderia dar
 * verdadeiro e entregar a playlist privada a um visitante.
 *
 * Privada de outra pessoa -> 403 (escolha deste projeto: ver respostas.md;
 * a alternativa seria 404, para nem revelar que a playlist existe).
 *
 * @returns {{ playlist, episodes, isOwner }}
 */
async function getPlaylistById(playlistId, currentUserId = null) {
  const playlist = await Playlist.findByPk(playlistId, {
    include: [{ model: User, as: 'owner', attributes: PUBLIC_USER_ATTRIBUTES }]
  });
  if (!playlist) {
    throw playlistNotFound();
  }

  const isOwner = currentUserId !== null && currentUserId === playlist.userId;

  if (!playlist.isPublic && !isOwner) {
    throw httpError('Esta playlist é privada.', 403);
  }

  // Do episódio adicionado mais recentemente para o mais antigo.
  const items = await PlaylistEpisode.findAll({
    where: { playlistId: playlist.id },
    include: [
      {
        model: Episode,
        as: 'episode',
        required: true,
        include: [{ model: User, as: 'author', attributes: PUBLIC_USER_ATTRIBUTES }]
      }
    ],
    order: [['createdAt', 'DESC'], ['id', 'DESC']]
  });

  return { playlist, episodes: items.map((item) => item.episode), isOwner };
}

/**
 * Adiciona o episódio à playlist. IDEMPOTENTE: repetir a mesma chamada não
 * muda nada (o episódio continua lá uma vez só, e o contador não sobe de novo).
 *
 * Duas escritas (linha na junção + contador) na MESMA transação, e o
 * increment SÓ quando a linha foi criada agora (`created`). Fora do if, o
 * contador subiria a cada clique repetido e passaria a "mentir".
 *
 * @returns {{ added: boolean, episodesCount: number }}
 */
async function addToPlaylist(userId, playlistId, episodeId) {
  const playlist = await findOwnedPlaylistOrFail(playlistId, userId);

  const episode = await Episode.findByPk(episodeId, { attributes: ['id'] });
  if (!episode) {
    throw episodeNotFound();
  }

  let added;
  try {
    added = await sequelize.transaction(async (t) => {
      const [, created] = await PlaylistEpisode.findOrCreate({
        where: { playlistId: playlist.id, episodeId: episode.id },
        transaction: t
      });

      if (created) {
        await Playlist.increment('episodesCount', { by: 1, where: { id: playlist.id }, transaction: t });
      }
      return created;
    });
  } catch (err) {
    // Dois pedidos simultâneos: os dois "não acharam" e tentaram criar; o
    // índice único recusou o segundo. Para quem pediu, o resultado é o mesmo
    // de uma repetição: o episódio já está na playlist.
    if (!(err instanceof UniqueConstraintError)) throw err;
    added = false;
  }

  await playlist.reload();
  return { added, episodesCount: playlist.episodesCount };
}

/**
 * Remove o episódio da playlist. NÃO é idempotente na resposta: remover algo
 * que não está lá é 404 — o pedido não tem sobre o que agir.
 *
 * O destroy com `where` devolve QUANTAS linhas apagou; é esse número (e não
 * uma consulta anterior) que decide se o contador desce. Se nada foi apagado,
 * o 404 lançado dentro da transação também a desfaz.
 *
 * @returns {{ removed: true, episodesCount: number }}
 */
async function removeFromPlaylist(userId, playlistId, episodeId) {
  const playlist = await findOwnedPlaylistOrFail(playlistId, userId);

  await sequelize.transaction(async (t) => {
    const deleted = await PlaylistEpisode.destroy({
      where: { playlistId: playlist.id, episodeId },
      transaction: t
    });

    if (deleted === 0) {
      throw httpError('Este episódio não está na playlist.', 404);
    }

    await Playlist.decrement('episodesCount', { by: deleted, where: { id: playlist.id }, transaction: t });
  });

  await playlist.reload();
  return { removed: true, episodesCount: playlist.episodesCount };
}

/**
 * Exclui a playlist. As linhas da junção são apagadas ANTES da playlist, na
 * mesma transação — o CASCADE faria isso sozinho, mas apagar explicitamente
 * deixa a regra visível no código e não depende de como a FK foi criada.
 * O episódio em si continua existindo: só a ligação some.
 */
async function deletePlaylist(userId, playlistId) {
  const playlist = await findOwnedPlaylistOrFail(playlistId, userId);

  await sequelize.transaction(async (t) => {
    await PlaylistEpisode.destroy({ where: { playlistId: playlist.id }, transaction: t });
    await playlist.destroy({ transaction: t });
  });
}

/**
 * As playlists de `userId`, cada uma dizendo se contém `episodeId`
 * (hasEpisode). É o que o modal "Salvar" precisa para já abrir com as caixas
 * marcadas.
 *
 * Duas consultas e um Set, em vez de uma consulta por playlist: a 2ª consulta
 * traz só os ids das playlists DESTA pessoa que contêm o episódio (usa o
 * índice em episode_id), e o Set responde "contém?" em tempo constante.
 *
 * @returns {Array<{ id, title, isPublic, episodesCount, hasEpisode }>}
 */
async function getPlaylistsStatusForEpisode(userId, episodeId) {
  const episode = await Episode.findByPk(episodeId, { attributes: ['id'] });
  if (!episode) {
    throw episodeNotFound();
  }

  const playlists = await getUserPlaylists(userId);
  if (playlists.length === 0) {
    return [];
  }

  const rows = await PlaylistEpisode.findAll({
    where: { episodeId: episode.id, playlistId: playlists.map((playlist) => playlist.id) },
    attributes: ['playlistId']
  });
  const withEpisode = new Set(rows.map((row) => row.playlistId));

  return playlists.map((playlist) => ({
    id: playlist.id,
    title: playlist.title,
    isPublic: playlist.isPublic,
    episodesCount: playlist.episodesCount,
    hasEpisode: withEpisode.has(playlist.id)
  }));
}

module.exports = {
  findOwnedPlaylistOrFail,
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addToPlaylist,
  removeFromPlaylist,
  deletePlaylist,
  getPlaylistsStatusForEpisode
};
