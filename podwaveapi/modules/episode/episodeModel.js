const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// Episode é a primeira entidade de conteúdo do PodWave além do usuário.
// Grupo A (dois arquivos): o áudio é o conteúdo principal do episódio, e a
// capa é a identidade visual separada dele — exatamente o exemplo de
// "áudio com capa do episódio" citado no enunciado da Aula 07.
//
// A ligação com User (userId) é a FK declarada aqui no model; a associação
// Sequelize (hasMany/belongsTo) propriamente dita fica centralizada em
// config/associations.js, não aqui.
const Episode = sequelize.define('Episode',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: true },
    // Nome do arquivo de áudio salvo em disco (não o caminho completo — a
    // pasta é sempre a mesma, public/uploads/episodes/audio/, então basta
    // guardar o filename e montar a URL completa quando for exibir).
    audio: { type: DataTypes.STRING, allowNull: false },
    // Nome do arquivo de capa salvo em disco (public/uploads/episodes/covers/).
    cover: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false }
  },
  {
    timestamps: true,
    tableName: 'episodes'
  }
);

module.exports = Episode;
