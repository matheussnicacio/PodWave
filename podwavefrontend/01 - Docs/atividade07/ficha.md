# Ficha de Preparação — Atividade Aula 07 (PodWave)

## Seção 2 — Padrão de arquivo do projeto

| Dado                                                                 | Seu valor                                                                 |
|------------------------------------------------------------------------|----------------------------------------------------------------------------|
| Nome do model da sua entidade principal (singular, PascalCase)         | `Episode`                                                                   |
| Nome da tabela (plural, snake_case)                                    | `episodes`                                                                  |
| Grupo (A ou B)                                                         | **A** — dois arquivos (conteúdo + capa)                                    |
| Nome do campo do arquivo principal                                     | `audio`                                                                     |
| Nome do campo da capa (só Grupo A)                                     | `cover`                                                                     |
| Nome da coluna de contagem no User que será incrementada hoje          | `episodesCount` (já existe no `userModel.js` desde a Aula 03)              |

### Por que Grupo A, e não Grupo B

A funcionalidade sorteada para o PodWave é "Upload de episódios em áudio
(mp3) pelo criador do podcast". O conteúdo principal é um arquivo de
**áudio**, que não é, ele mesmo, uma imagem — ao contrário do Grupo B (onde
a única mídia enviada já é a imagem-conteúdo). Faz sentido o episódio ter
também uma **capa** (imagem de destaque, exibida nas listagens antes mesmo
de o episódio ser reproduzido), separada do áudio em si. É literalmente o
exemplo "de áudio com capa do episódio" citado no próprio enunciado da
Aula 07 como caso de Grupo A.

### Onde cada nome aparece no código

- Model: `podwaveapi/modules/episode/episodeModel.js` (campos `title`,
  `description`, `audio`, `cover`, `userId`)
- Tabela: `episodes` (`tableName: 'episodes'`, criada por `sequelize.sync`)
- Associação: `podwaveapi/config/associations.js`
  (`User.hasMany(Episode)` / `Episode.belongsTo(User)`)
- Upload: `podwaveapi/middlewares/episodeMulter.js`
  (`multer.fields([{ name: 'audio' }, { name: 'cover' }])`)
- Contador: `User.episodesCount`, incrementado em
  `podwaveapi/modules/episode/episodeService.js` via
  `User.increment('episodesCount', ...)`
