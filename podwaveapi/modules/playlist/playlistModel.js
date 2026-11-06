const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// Uma linha = uma playlist (a "coleção" do PodWave): uma lista pessoal de
// episódios, de qualquer autor, montada por um usuário.
//
// isPublic começa FALSE: uma lista pessoal é privada até a dona decidir
// mostrá-la. O padrão seguro é o que não expõe nada sem uma ação explícita.
//
// episodesCount é um CONTADOR DESNORMALIZADO: a verdade está na tabela de
// junção (playlist_episodes) e o contador é só uma cópia, guardada aqui para
// a lista "Minhas Playlists" não precisar de um COUNT(*) por playlist. Toda
// escrita na junção precisa atualizá-lo na MESMA transação — ninguém (nem o
// ON DELETE CASCADE do banco) faz isso por nós.
//
// Índice em user_id: "as playlists da pessoa X" é a consulta mais comum
// (GET /my-playlists e o status do modal "Salvar").
const Playlist = sequelize.define('Playlist',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: true },
    isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    episodesCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    }
  },
  {
    timestamps: true,
    tableName: 'playlists',
    indexes: [
      { fields: ['user_id'], name: 'idx_playlist_user' }
    ]
  }
);

module.exports = Playlist;
