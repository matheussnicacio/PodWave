const User = require('../modules/user/userModel');
const Episode = require('../modules/episode/episodeModel');
const Like = require('../modules/like/likeModel');
const Comment = require('../modules/comment/commentModel');
const Follow = require('../modules/follow/followModel');
const Playlist = require('../modules/playlist/playlistModel');
const PlaylistEpisode = require('../modules/playlist/playlistEpisodeModel');
const Notification = require('../modules/notification/notificationModel');
const Report = require('../modules/report/reportModel');

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

// Aula 10 — curtidas e comentários. Associações nos DOIS sentidos (hasMany +
// belongsTo) para cada par: é o que permite tanto Like.findAll({ include:
// episode }) quanto Episode.findAll({ include: comments }) e cria as FKs de
// verdade no banco.
User.hasMany(Like, { foreignKey: 'userId', as: 'likes', onDelete: 'CASCADE' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Episode.hasMany(Like, { foreignKey: 'episodeId', as: 'likes', onDelete: 'CASCADE' });
Like.belongsTo(Episode, { foreignKey: 'episodeId', as: 'episode' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });
Episode.hasMany(Comment, { foreignKey: 'episodeId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Episode, { foreignKey: 'episodeId', as: 'episode' });

// Aula 11 — seguir pessoas. Follow liga User a User: as DUAS FKs apontam para
// a mesma tabela, então cada belongsTo precisa de um apelido (`as`). É o
// apelido que diz ao `include` qual das duas colunas usar:
//   include { as: 'Follower'  } -> a pessoa de follower_id  (quem segue)
//   include { as: 'Following' } -> a pessoa de following_id (quem é seguido)
// Só belongsTo (sem hasMany em User): a lista de seguidores/seguindo é sempre
// consultada a partir de Follow, então o outro sentido não é necessário.
Follow.belongsTo(User, { as: 'Follower', foreignKey: 'followerId', onDelete: 'CASCADE' });
Follow.belongsTo(User, { as: 'Following', foreignKey: 'followingId', onDelete: 'CASCADE' });

// Aula 13 — playlists. A relação Playlist <-> Episode é muitos-para-muitos,
// modelada EXPLICITAMENTE pela tabela de junção PlaylistEpisode (em vez de um
// belongsToMany "mágico"): a junção é um model de verdade, com seus índices,
// e o service escreve nela diretamente (findOrCreate/destroy) junto do
// contador, na mesma transação.
//
// Seis associações: os dois lados de cada par (hasMany + belongsTo).
//  - Playlist <-> PlaylistEpisode: os itens de uma playlist;
//  - Episode  <-> PlaylistEpisode: em quais playlists um episódio está;
//  - User     <-> Playlist:        a dona da playlist (as: 'owner').
// onDelete: 'CASCADE' cria as FKs com ON DELETE CASCADE no banco: apagar a
// playlist ou o episódio apaga as linhas da junção. ATENÇÃO: o CASCADE NÃO
// mexe no playlists.episodes_count — isso é responsabilidade do código.
Playlist.hasMany(PlaylistEpisode, { foreignKey: 'playlistId', as: 'items', onDelete: 'CASCADE' });
PlaylistEpisode.belongsTo(Playlist, { foreignKey: 'playlistId', as: 'playlist', onDelete: 'CASCADE' });
Episode.hasMany(PlaylistEpisode, { foreignKey: 'episodeId', as: 'playlistItems', onDelete: 'CASCADE' });
PlaylistEpisode.belongsTo(Episode, { foreignKey: 'episodeId', as: 'episode', onDelete: 'CASCADE' });
User.hasMany(Playlist, { foreignKey: 'userId', as: 'playlists', onDelete: 'CASCADE' });
Playlist.belongsTo(User, { foreignKey: 'userId', as: 'owner', onDelete: 'CASCADE' });

// Aula 14 — notificações e denúncias. Só o sentido belongsTo (cinco
// associações): as duas tabelas são sempre consultadas a partir delas
// mesmas, e é o belongsTo que cria as FKs.
//
// SEM onDelete explícito, de propósito: o Sequelize escolhe pelo allowNull
// da coluna, e é esse comportamento que queremos ver no banco:
//  - notifications.episode_id (allowNull: true)  -> ON DELETE SET NULL
//  - reports.episode_id       (allowNull: false) -> ON DELETE NO ACTION
// Em nenhum dos dois casos o banco "limpa sozinho": a exclusão do episódio
// apaga denúncias e avisos explicitamente (episodeService.deleteEpisode).
//
// Notification liga User a User (quem recebe e quem agiu): dois apelidos.
Notification.belongsTo(User, { as: 'Recipient', foreignKey: 'userId' });
Notification.belongsTo(User, { as: 'Actor', foreignKey: 'actorId' });
Notification.belongsTo(Episode, { as: 'episode', foreignKey: 'episodeId' });
Report.belongsTo(User, { as: 'Reporter', foreignKey: 'userId' });
Report.belongsTo(Episode, { as: 'episode', foreignKey: 'episodeId' });

module.exports = { User, Episode, Like, Comment, Follow, Playlist, PlaylistEpisode, Notification, Report };
