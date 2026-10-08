# Atividade Aula 10 — PodWave (Curtidas e Comentários no Episódio)

Entidade principal: **Episode** · FK nas tabelas novas: `episodeId` · contadores: `likesCount` / `commentsCount`.

## Backend (`podwaveapi/`)
| Item | Arquivo |
|---|---|
| `COMMENT_MAX = 500` | `config/constants.js` |
| `likesCount` / `commentsCount` no Episode | `modules/episode/episodeModel.js` |
| Models `Like` (índice único composto) e `Comment` | `modules/like/likeModel.js`, `modules/comment/commentModel.js` |
| Associações nos dois sentidos | `config/associations.js` |
| `POST /api/episodes/:episodeId/toggle-like` (201 curtiu / 200 descurtiu) | `modules/like/*` |
| `GET /api/episodes/:episodeId/like-status` (`optionalAuth`) | `modules/like/*` |
| `GET /api/liked-episodes` (com autor) | `modules/like/*` |
| `POST` (auth + validação) e `GET` (público) `/api/episodes/:episodeId/comments` | `modules/comment/*` |
| `isLiked` + contadores no detalhe | `episodeService.getEpisodeDetails` |
| Exclusão em transação (likes + comments + episódio + contador do usuário) | `episodeService.deleteEpisode` |
| Criação do episódio também em transação (episódio + contador do usuário) | `episodeService.createEpisode` |
| Contadores no perfil público (vêm junto dos episódios incluídos) | `userService.getPublicProfile` |
| `trim()` movido para o início | `userValidator.js` |

## Frontend (`podwavefrontend/`)
| Item | Arquivo |
|---|---|
| Services | `services/likeService.js`, `services/commentService.js` |
| Formatadores | `utils/format.js` |
| Botão com atualização otimista, rollback e `isBusy` | `components/episodes/LikeButton.vue` |
| Seção de comentários | `components/episodes/CommentSection.vue` |
| Detalhe com curtir + comentários | `views/podcasts/PodcastDetailView.vue` |
| Contadores no card | `components/episodes/EpisodeCard.vue` |
| Tela de itens curtidos (`/liked`) | `views/podcasts/LikedEpisodesView.vue`, `router/index.js` |
| Acesso por um clique | `TheSidebar.vue` (Curtidos) e menu do avatar em `TheNavbar.vue` |
| CSS | `assets/main.css` (seção Aula 10) |

## Testes (Parte A)
```bash
cd podwaveapi
API=http://localhost:4000/api AUDIO=./audio-teste.mp3 CAPA=./capa-teste.jpg \
DB="mariadb -uroot podwave" \
bash "../podwavefrontend/01 - Docs/atividade10/testes-curl-atividade10.sh"
```
Tire um print de cada bloco numerado (00–09). Ajuste `DB` para o seu cliente de banco.

## Prints que precisam ser tirados por você no navegador
`detalhe-interacao.jpg`, `otimista.jpg` (Network → Slow 4G), `rollback.jpg` (Offline),
`curtidos.jpg` e `unique.jpg` (bloco 04 do script, ou no seu cliente de banco).

## Observação técnica: concorrência no toggle
Em teste com 6–7 cliques simultâneos do mesmo usuário, a primeira versão deixou
`likes_count` em `-2` (várias requisições liam "já curtiu", todas decrementavam, só um `DELETE`
removia a linha). Correção em `likeService.toggleLike`: `SELECT ... FOR UPDATE` na linha do
episódio (`lock: t.LOCK.UPDATE`) + conferência das linhas afetadas pelo `destroy`. Reteste: linhas
em `likes` e `likes_count` sempre iguais (rodadas de 7 requisições paralelas).
