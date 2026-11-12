const { UniqueConstraintError } = require('sequelize');
const Report = require('./reportModel');
const Episode = require('../episode/episodeModel');

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/**
 * Registra a denúncia de `userId` contra o episódio `episodeId`.
 *
 * Ordem: o episódio existe? (404) -> é meu? (400: não faz sentido denunciar o
 * próprio episódio — quem quer tirá-lo do ar pode excluí-lo) -> já denunciei?
 * (409).
 *
 * 409 e não 200 (diferente de "adicionar à playlist"): a playlist é um ESTADO
 * ("o episódio está nela"), e repetir o pedido chega ao mesmo estado. A
 * denúncia é um REGISTRO de algo que a pessoa fez; a segunda tentativa
 * conflita com o registro que já existe, e a tela precisa dizer isso
 * ("você já denunciou"), não fingir que deu certo.
 *
 * Quem garante uma denúncia por pessoa, mesmo com dois cliques simultâneos, é o
 * índice ÚNICO (user_id, episode_id): findOrCreate tenta criar, e o banco
 * recusa a segunda linha.
 *
 * Sem transação (é UMA escrita só) e sem notificar o dono: denúncia é
 * assunto da moderação, não um aviso para quem foi denunciado.
 */
async function reportEpisode(userId, episodeId, reason) {
  const episode = await Episode.findByPk(episodeId, { attributes: ['id', 'userId'] });
  if (!episode) {
    throw httpError('Episódio não encontrado.', 404);
  }
  if (episode.userId === userId) {
    throw httpError('Você não pode denunciar o seu próprio episódio.', 400);
  }

  let report;
  let created;
  try {
    [report, created] = await Report.findOrCreate({
      where: { userId, episodeId: episode.id },
      defaults: { userId, episodeId: episode.id, reason }
    });
  } catch (err) {
    if (!(err instanceof UniqueConstraintError)) throw err;
    created = false;
  }

  if (!created) {
    throw httpError('Você já denunciou este episódio.', 409);
  }

  return report;
}

module.exports = { reportEpisode };
