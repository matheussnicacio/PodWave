const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Comment = sequelize.define('Comment',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // Limite do banco igual ao da validação (VALIDATION.COMMENT_MAX = 500).
    content: { type: DataTypes.STRING(500), allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    episodeId: { type: DataTypes.INTEGER, allowNull: false }
  },
  {
    timestamps: true,
    tableName: 'comments'
  }
);

module.exports = Comment;
