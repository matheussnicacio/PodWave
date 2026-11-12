const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const { NOTIFICATION } = require('../../config/constants');

// Uma linha = um aviso para `userId` (quem RECEBE): "`actorId` (quem AGIU)
// curtiu / comentou o seu episódio" ou "começou a seguir você".
//
// episodeId é OPCIONAL (allowNull: true): o aviso de "seguir" não tem
// episódio. Por ser opcional, a FK nasce com ON DELETE SET NULL — se o
// episódio for apagado sem limpar os avisos, eles sobram com episode_id NULL
// (um aviso "órfão"). Por isso a exclusão do episódio apaga os avisos dele.
//
// type é ENUM: o banco recusa qualquer valor fora da lista.
//
// ÍNDICES (nomes FÍSICOS, por causa do `underscored: true`):
//  1) (user_id, is_read): cobre as duas consultas do sino — "as minhas" (prefixo
//     user_id) e "as minhas NÃO LIDAS" (user_id + is_read), que o polling faz
//     a cada 30 s para cada pessoa logada.
//  2) (episode_id): cobre a limpeza quando um episódio é excluído.
const Notification = sequelize.define('Notification',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    actorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    type: {
      type: DataTypes.ENUM(...Object.values(NOTIFICATION.TYPES)),
      allowNull: false
    },
    episodeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'episodes', key: 'id' }
    },
    isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  },
  {
    timestamps: true,
    tableName: 'notifications',
    indexes: [
      { fields: ['user_id', 'is_read'], name: 'idx_notification_user_read' },
      { fields: ['episode_id'], name: 'idx_notification_episode' }
    ]
  }
);

module.exports = Notification;
