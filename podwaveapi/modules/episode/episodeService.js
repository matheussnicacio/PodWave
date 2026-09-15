const Episode = require('./episodeModel');
const User = require('../user/userModel');

async function createEpisode(userId, { title, description, audioFilename, coverFilename }) {
  const newEpisode = await Episode.create({
    title,
    description: description || null,
    audio: audioFilename,
    cover: coverFilename,
    userId
  });

  // Contador do usuário (Aula 03) incrementado a cada episódio publicado
  // com sucesso. increment() gera um UPDATE atômico direto no banco
  // (episodes_count = episodes_count + 1), em vez de ler o valor, somar em
  // memória e salvar de volta — evita perder incrementos concorrentes se
  // o mesmo usuário publicar dois episódios em paralelo.
  await User.increment('episodesCount', { by: 1, where: { id: userId } });

  return {
    id: newEpisode.id,
    title: newEpisode.title,
    description: newEpisode.description,
    audio: newEpisode.audio,
    cover: newEpisode.cover,
    userId: newEpisode.userId,
    createdAt: newEpisode.createdAt
  };
}

module.exports = { createEpisode };
