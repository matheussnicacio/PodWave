const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// Uma linha = "o usuário X curtiu o episódio Y".
//
// Por que o índice ÚNICO COMPOSTO (userId + episodeId) precisa existir no
// BANCO e não só no código: um `if (!jaCurtiu) criar()` no service tem uma
// janela de corrida — dois cliques/abas/requisições quase simultâneas passam
// os dois pelo `if` antes de qualquer um gravar, e a pessoa acaba com duas
// curtidas (e o contador soma 2). O índice único é a única garantia que vale
// mesmo com concorrência, scripts, outro cliente da API ou um bug futuro: o
// banco recusa a segunda linha, aconteça o que acontecer no código.
//
// A coluna do índice usa o nome FÍSICO (user_id / episode_id) porque o
// projeto usa `underscored: true` (config/database.js).
const Like = sequelize.define('Like',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    episodeId: { type: DataTypes.INTEGER, allowNull: false }
  },
  {
    timestamps: true,
    tableName: 'likes',
    indexes: [
      { unique: true, fields: ['user_id', 'episode_id'], name: 'idx_unique_like_user_episode' }
    ]
  }
);

module.exports = Like;
