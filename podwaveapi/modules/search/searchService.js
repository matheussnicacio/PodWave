const { Op } = require('sequelize');
const Episode = require('../episode/episodeModel');
const User = require('../user/userModel');
const { SEARCH } = require('../../config/constants');

// Só colunas PÚBLICAS do usuário (nunca password, email, isAdmin...).
const PUBLIC_USER_ATTRIBUTES = ['id', 'username', 'fullName', 'profilePicture'];

/**
 * Escapa os curingas do LIKE: % (qualquer sequência), _ (qualquer caractere)
 * e a própria barra invertida (o caractere de escape do MySQL).
 *
 * Sem isso, quem digita "%%" monta `LIKE '%%%%'` — que casa com QUALQUER
 * texto e devolve a tabela inteira (até o LIMIT). Com o escape, "%%" vira
 * `LIKE '%\%\%%'`: procura o texto literal "%%".
 *
 * A barra entra na lista (e é escapada primeiro, pela própria classe [\\%_])
 * para que um "\" digitado não "escape" o curinga que nós mesmos adicionamos.
 */
function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}

/** Episódios cujo título contém o termo, com o autor (só colunas públicas). */
async function searchEpisodes(query) {
  return Episode.findAll({
    where: { title: { [Op.like]: `%${escapeLike(query)}%` } },
    include: [{ model: User, as: 'author', attributes: PUBLIC_USER_ATTRIBUTES }],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit: SEARCH.LIMIT
  });
}

/** Pessoas cujo username OU nome completo contém o termo. */
async function searchUsers(query) {
  const pattern = `%${escapeLike(query)}%`;
  return User.findAll({
    where: {
      [Op.or]: [
        { username: { [Op.like]: pattern } },
        { fullName: { [Op.like]: pattern } }
      ]
    },
    attributes: [...PUBLIC_USER_ATTRIBUTES, 'bio'],
    order: [['username', 'ASC']],
    limit: SEARCH.LIMIT
  });
}

/**
 * As duas buscas EM PARALELO: são independentes, então não há por que esperar
 * uma terminar para começar a outra. O tempo total é o da mais lenta, não a soma.
 *
 * Chamadas pelo nome (searchEpisodes, searchUsers), sem `this`: a função é
 * exportada num objeto e pode ser chamada "solta"; `this.searchUsers` quebraria.
 */
async function globalSearch(query) {
  const [podcasts, users] = await Promise.all([searchEpisodes(query), searchUsers(query)]);
  return { podcasts, users };
}

module.exports = { escapeLike, searchEpisodes, searchUsers, globalSearch };
