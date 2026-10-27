const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// Uma linha = "o usuário `followerId` segue o usuário `followingId`".
//
// Diferente de Like/Comment (usuário <-> episódio), Follow liga USUÁRIO a
// USUÁRIO: as DUAS colunas apontam para a MESMA tabela (users). Por isso, em
// config/associations.js, as duas associações precisam de apelidos (`as`):
//   Follow.belongsTo(User, { as: 'Follower',  foreignKey: 'followerId'  })
//   Follow.belongsTo(User, { as: 'Following', foreignKey: 'followingId' })
// Sem os apelidos, o Sequelize não teria como saber a qual das duas colunas
// um `include: User` se refere.
//
// Leitura em voz alta (para nunca trocar uma lista pela outra):
//   - "quem SEGUE a pessoa X"  -> linhas com followingId = X  (o seguidor é o Follower)
//   - "quem a pessoa X SEGUE"  -> linhas com followerId  = X  (o seguido é o Following)
//
// ÍNDICES (nomes FÍSICOS das colunas, pois o projeto usa `underscored: true`):
//  1) ÚNICO composto (follower_id, following_id): o banco recusa a segunda
//     linha "A segue B", mesmo com dois cliques simultâneos, outro cliente da
//     API ou um bug futuro. Um `if (!jaSegue) criar()` no código tem janela
//     de corrida; só o índice único fecha essa janela.
//     A ORDEM das colunas importa: um índice composto só serve a buscas que
//     usem o(s) PRIMEIRO(s) campo(s) dele (prefixo mais à esquerda). Este
//     atende "quem A segue?" (follower_id) e "A segue B?" (follower_id +
//     following_id), mas NÃO atende "quem segue B?" (só following_id).
//  2) Simples (following_id): é exatamente o que cobre a consulta que o
//     índice acima não cobre — a lista de seguidores de B. Sem ele, essa
//     consulta varreria a tabela inteira.
const Follow = sequelize.define('Follow',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    followerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    followingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    }
  },
  {
    timestamps: true,
    tableName: 'follows',
    indexes: [
      { unique: true, fields: ['follower_id', 'following_id'], name: 'idx_unique_follow_follower_following' },
      { fields: ['following_id'], name: 'idx_follow_following' }
    ]
  }
);

module.exports = Follow;
