# Atividade Aula 11 — PodWave (Seguir pessoas, Seguidores/Seguindo e Feed de quem eu sigo)

Seguir é uma relação **usuário ↔ usuário**. No PodWave a entidade principal é o **Episode**; só o feed
filtrado depende dela.

| Ficha | PodWave |
|---|---|
| Contador de seguidores no `User` | `followersCount` |
| Contador de "seguindo" no `User` | `followingCount` |
| Rota do feed filtrado (API) | `GET /api/following-episodes` |
| Rota do feed filtrado (front) / item da Sidebar | `/following` (nome `following-feed`) |

## Backend (`podwaveapi/`)
| Item | Arquivo |
|---|---|
| Model `Follow` (`follower_id`, `following_id`, índice **único composto** + índice em `following_id`) | `modules/follow/followModel.js` |
| Associações com apelidos `Follower` / `Following` | `config/associations.js` |
| `toggleFollow` (400 → 404 → transação: linha + 2 contadores), `getFollowStatus`, `getFollowers`, `getFollowing` | `modules/follow/followService.js` |
| `parseUserId` (400 se não for inteiro positivo), 201/200 no toggle, handlers | `modules/follow/followController.js` |
| `POST /users/:userId/toggle-follow` e `GET /users/:userId/follow-status` (auth) · `GET /users/:userId/followers` e `/following` (públicas) · `GET /following-episodes` (auth) | `modules/follow/followRoutes.js` |
| Registro das rotas (antes do 404 e do `errorHandler`) | `app.js` |
| `getFollowingEpisodes(userId, page, limit)` — `Op.in`, `[]` cedo se não segue ninguém | `modules/episode/episodeService.js` |
| `isFollowing` no perfil público (só consulta se há logado e não é o dono) | `modules/user/userService.js` |

## Frontend (`podwavefrontend/`)
| Item | Arquivo |
|---|---|
| Service (`toggleFollow`, `getFollowers`, `getFollowing`, `getFollowingEpisodes`) | `services/followService.js` |
| `FollowButton` — `defineModel` (`following`, `followersCount`), otimista, rollback, `isBusy` | `components/follow/FollowButton.vue` |
| Perfil público: botão ativo + números viram links | `views/profile/PublicProfileView.vue` |
| Seguidores / Seguindo (uma tela, duas rotas, `props: { kind }`, abas, estados vazios) | `views/profile/FollowListView.vue` |
| Feed de quem eu sigo (página, `hasMore`, "Carregar mais") | `views/FollowingFeedView.vue` |
| Rotas `followers`, `following-list`, `following-feed` | `router/index.js` |
| Item **Seguindo** na Sidebar | `components/layout/TheSidebar.vue` |
| CSS (seção Aula 11) | `assets/main.css` |

## Checagem de alcançabilidade (ADR-012)
| Peça | Caminho de clique |
|---|---|
| Seguir / deixar de seguir | Perfil público de outra pessoa → botão **Seguir/Seguindo**. Visitante → clique leva ao `/login?redirect=…` e volta ao perfil. |
| Listas | Perfil público → número **seguidores** / **seguindo** (links) → abas entre as duas listas → link "Voltar ao perfil". |
| Feed filtrado | Sidebar → **Seguindo** (`/following`), um clique. |

**O que foi encontrado e feito:** no `TheSidebar.vue` do PodWave **não existia** o item "Seguindo" (diferente
da Shortz-App, onde o link existia sem rota). Foram criados juntos o `router-link to="/following"` na Sidebar
e a rota `/following` no `router/index.js` — o mesmo path nos dois lados.

## Testes (Parte A)
```bash
cd podwaveapi
API=http://localhost:4000/api AUDIO=./audio-teste.mp3 CAPA=./capa-teste.jpg \
DB="mariadb -uroot podwave" \
bash "../podwavefrontend/01 - Docs/atividade11/testes-curl-atividade11.sh"
```
Tire um print de cada bloco numerado (00–09). O bloco 07 é o do print `follows.jpg` (índices + recusa da
linha repetida). Ajuste `DB` para o seu cliente de banco.

## Prints que precisam ser tirados por você no navegador
`seguindo.jpg`, `otimista.jpg` (Network → Slow 4G), `rollback.jpg` (Offline), `seguidores.jpg`,
`feed-seguindo.jpg` e `follows.jpg`.

## Observações técnicas
- **Trava das duas linhas de usuário, em ordem de id.** O `toggleFollow` faz `SELECT … FOR UPDATE` nas linhas
  do seguidor e do seguido, sempre do **menor id para o maior**. A trava evita o contador negativo visto na
  Atividade 10 (cliques simultâneos do mesmo par); a ordem fixa evita *deadlock* quando A segue B ao mesmo
  tempo em que B segue A. Reteste: 60 requisições cruzadas A↔B em rodadas paralelas → só `200`/`201`, nenhum
  `500`/`409`, contadores sempre iguais ao número de linhas e nunca negativos.
- **Paginação padrão.** O feed filtrado reaproveita `parsePagination` do projeto (padrão `page=1`,
  `limit=10`, teto 50), igual ao `/feed`. O front sempre manda `limit=8` explicitamente.
- **`FollowButton` e troca de perfil.** O botão guarda o `userId` do clique e descarta a resposta se a rota
  mudou para outra pessoa durante a requisição (evita escrever contador no perfil errado).
