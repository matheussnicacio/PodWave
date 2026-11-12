const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const { REPORT } = require('../../config/constants');

// Uma linha = "o usuário `userId` denunciou o episódio `episodeId` pelo
// motivo `reason`".
//
// reason é ENUM com as cinco CHAVES fixas: segunda defesa do motivo (a
// primeira é o validator). Mesmo que um bug ou outro cliente pule o
// validator, o banco recusa ("Data truncated for column 'reason'").
//
// episodeId é OBRIGATÓRIO (allowNull: false): uma denúncia sem episódio não
// faz sentido. A FK nasce com ON DELETE NO ACTION — o banco RECUSA apagar
// um episódio que ainda tem denúncias. Por isso a exclusão do episódio apaga
// as denúncias antes (filhas antes do pai).
//
// ÍNDICES:
//  1) ÚNICO (user_id, episode_id): uma denúncia por pessoa por episódio —
//     garantido pelo banco, mesmo com dois cliques simultâneos.
//  2) (episode_id): "as denúncias deste episódio" (Aula 15) e a limpeza na exclusão.
const Report = sequelize.define('Report',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    episodeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'episodes', key: 'id' }
    },
    reason: {
      type: DataTypes.ENUM(...REPORT.REASONS),
      allowNull: false
    }
  },
  {
    timestamps: true,
    tableName: 'reports',
    indexes: [
      { unique: true, fields: ['user_id', 'episode_id'], name: 'idx_unique_report_user_episode' },
      { fields: ['episode_id'], name: 'idx_report_episode' }
    ]
  }
);

module.exports = Report;
