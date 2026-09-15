const User = require('../modules/user/userModel');
const Episode = require('../modules/episode/episodeModel');

// Por que declarar a associação explicitamente para o Sequelize:
// a FK userId já existe como coluna comum no episodeModel.js, mas, sem as
// linhas abaixo, o Sequelize não sabe que essa coluna representa uma
// relação. É só com hasMany/belongsTo que passam a existir os métodos
// mágicos (user.getEpisodes(), episode.getUser(), o "include" do Sequelize
// para trazer o autor junto de cada episódio etc.) e que o `alter: true`
// do sync sabe que precisa criar essa FK de verdade no banco, com sua
// constraint.
//
// Por que centralizar todas as associações num arquivo só, em vez de
// declarar User.hasMany(Episode) dentro do userModel.js e
// Episode.belongsTo(User) dentro do episodeModel.js:
// isso criaria uma referência circular entre os dois arquivos —
// userModel.js precisaria de require('../episode/episodeModel') para
// declarar hasMany, e episodeModel.js precisaria de
// require('../user/userModel') para declarar belongsTo. Cada um dos dois
// module.exports ficaria pela metade quando o outro arquivo tentasse
// importá-lo no meio do carregamento (dependendo da ordem de require),
// gerando um module.exports undefined ou incompleto. Um arquivo à parte,
// que importa os dois models já prontos e só then declara as relações
// entre eles, evita esse ciclo: os models continuam "puros" (só suas
// colunas), e associations.js é o único lugar que precisa conhecer os dois
// ao mesmo tempo.
User.hasMany(Episode, { foreignKey: 'userId', as: 'episodes' });
Episode.belongsTo(User, { foreignKey: 'userId', as: 'author' });

module.exports = { User, Episode };
