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
//  3) (status): Aula 15 — o filtro do painel e as contagens do Dashboard.
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
    },
    // Aula 15 — situação da denúncia ('pending' | 'reviewed').
    // O defaultValue é o que permite ao sync({ alter: true }) acrescentar a
    // coluna a uma tabela que JÁ TEM linhas: uma coluna NOT NULL nova precisa
    // de um valor para as linhas antigas. Com o padrão, o ALTER TABLE ... ADD
    // COLUMN ... NOT NULL DEFAULT 'pending' preenche todas as denúncias que
    // já existiam com 'pending' (que é a verdade: ninguém as revisou ainda).
    // Sem o padrão, o MySQL recusaria (ou encheria a coluna com '' — um valor
    // fora do ENUM).
    status: {
      type: DataTypes.ENUM(...Object.values(REPORT.STATUS)),
      allowNull: false,
      defaultValue: REPORT.STATUS.PENDING
    },
    // Quando foi revisada. NULL enquanto pendente; gravado UMA vez (revisar
    // de novo não muda a data — a revisão é idempotente).
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    timestamps: true,
    tableName: 'reports',
    indexes: [
      { unique: true, fields: ['user_id', 'episode_id'], name: 'idx_unique_report_user_episode' },
      { fields: ['episode_id'], name: 'idx_report_episode' },
      // 3) (status): a lista do painel filtra por situação (pendentes é o
      //    padrão) e o Dashboard conta pendentes e revisadas.
      { fields: ['status'], name: 'idx_reports_status' }
    ]
  }
);

module.exports = Report;
