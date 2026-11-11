const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// TABELA DE JUNÇÃO: uma linha = "o episódio Y está na playlist X".
//
// Por que uma tabela à parte: a relação é MUITOS-PARA-MUITOS — uma playlist
// tem vários episódios e um episódio pode estar em várias playlists (de várias
// pessoas). Uma coluna playlistId em `episodes` só guardaria UMA playlist por
// episódio; uma coluna episodeId em `playlists`, só UM episódio por playlist.
// Cada par vira uma linha aqui.
//
// ÍNDICES (nomes FÍSICOS, por causa do `underscored: true`):
//  1) ÚNICO composto (playlist_id, episode_id): o banco recusa o mesmo
//     episódio duas vezes na mesma playlist, mesmo com cliques simultâneos.
//     Também acelera "os episódios da playlist X" e "X contém Y?" — o
//     prefixo mais à esquerda é playlist_id.
//  2) Simples (episode_id): cobre o que o primeiro NÃO cobre — "em quais
//     playlists está o episódio Y?" (status do modal "Salvar" e a limpeza
//     quando o episódio é excluído). Sem ele, essas consultas varreriam a
//     tabela inteira.
const PlaylistEpisode = sequelize.define('PlaylistEpisode',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    playlistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'playlists', key: 'id' }
    },
    episodeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'episodes', key: 'id' }
    }
  },
  {
    timestamps: true,
    tableName: 'playlist_episodes',
    indexes: [
      { unique: true, fields: ['playlist_id', 'episode_id'], name: 'idx_unique_playlist_episode' },
      { fields: ['episode_id'], name: 'idx_playlist_episode_episode' }
    ]
  }
);

module.exports = PlaylistEpisode;
