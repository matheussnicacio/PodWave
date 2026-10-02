# Atividade Aula 08 — PodWave (Streaming, Detalhe e Feed Paginado)

Entidade principal: **Episode** · **Grupo A** (áudio mp3 + capa) → o projeto
**tem streaming** (rota `/stream` com `Range`).

## O que foi feito

### Backend (`podwaveapi/`)
| Item | Arquivo |
|---|---|
| `optionalAuth` (não bloqueia, só identifica) | `middlewares/optionalAuth.js` |
| Coluna `views` (nova, `defaultValue: 0`; criada pelo `sync({ alter: true })`) | `modules/episode/episodeModel.js` |
| `getEpisodeDetails`, `getFeedEpisodes`, `parsePagination`, `getEpisodeAudioFile` | `modules/episode/episodeService.js` |
| `GET /api/episodes/:id` (pública, `optionalAuth`, autor via `include`, `isOwner`) | `episodeController.js` / `episodeRoutes.js` |
| `GET /api/episodes/:id/stream` (`isAuthenticated`, `Range` → 206, `audio/mpeg`) | `episodeController.js` / `episodeRoutes.js` |
| `GET /api/feed?page=&limit=` (`isAuthenticated`) | `userController.js` / `userRoutes.js` |
| `PAGINATION` (padrão 1 / 10, máx. 50) | `config/constants.js` |

O autor sai com `attributes: ['id','username','fullName','profilePicture']` —
`password` e `email` nunca são lidos do banco nessa consulta.

### Frontend (`podwavefrontend/`)
| Item | Arquivo |
|---|---|
| `getEpisodeAudioUrl`, `getEpisodeCoverUrl` | `src/utils/media.js` |
| Classes `.episode-grid`, `.episode-card*` (capa 1:1), `.episode-detail-cover`, `.episode-player` | `src/assets/main.css` |
| `getEpisodeById`, `getFeed` | `src/services/episodeService.js` |
| Card reutilizável | `src/components/episodes/EpisodeCard.vue` |
| Feed com "Carregar mais" | `src/views/FeedView.vue` |
| Detalhe com `<audio>` + `isOwner` guardado no estado | `src/views/podcasts/PodcastDetailView.vue` |

## Testes de curl (Parte A, Etapa 5)
Script pronto: `testes-curl-atividade08.sh` (rodar de dentro de `podwaveapi`).

```bash
EMAIL=voce@email.com SENHA=suasenha ID=1 bash testes-curl-atividade08.sh
```

Resultado obtido ao testar a implementação (MariaDB local, 2 episódios, 2 usuários):

| Teste | Esperado | Obtido |
|---|---|---|
| Detalhe sem token | 200, `isOwner:false`, views = 1 | ✅ |
| Detalhe com token do dono | 200, `isOwner:true`, views = 2 | ✅ |
| Detalhe de token inválido | 200 (visitante, nunca 401) | ✅ |
| Detalhe inexistente (`999`, `abc`) | 404 | ✅ |
| `/stream` sem token | 401 | ✅ |
| `/stream` com token | 200 | ✅ |
| `/uploads/episodes/audio/...` sem token | 200 (inconsistência) | ✅ |
| `/stream` com `Range: bytes=0-1023` | 206, `Content-Range: bytes 0-1023/47575` | ✅ |
| `/stream` com `Range` fora do arquivo | 416 | ✅ |
| Feed sem token | 401 | ✅ |
| Feed `?page=1&limit=1` | 1 item (o mais recente) | ✅ |
| Feed `?page=2&limit=1` | próximo item | ✅ |
| Feed `?page=3&limit=1` | `[]` | ✅ |

## Explicações

**1. `isAuthenticated` × `optionalAuth`.** `isAuthenticated` *bloqueia*: sem
token (ou token inválido) a requisição termina em 401 e o controller nem roda.
`optionalAuth` só *tenta identificar*: com token válido preenche `req.user`;
sem token, ou com token ruim, deixa `req.user` indefinido e **segue em frente**.
O detalhe do episódio precisa do segundo porque a rota é pública (visitante
também pode ver o episódio), mas, quando quem pede está logado, o controller
precisa saber quem é para calcular `isOwner` (`req.user.id === episode.userId`).
Com `isAuthenticated` o visitante levaria 401; sem nenhum middleware, nunca
saberíamos quem é o dono.

**2. Por que `<audio>`/`<video>`/`<img>` não enviam `Authorization`.** Essas
tags disparam a requisição do `src` sozinhas, pelo navegador — não passa por
Axios, interceptor ou qualquer JavaScript nosso, e HTML não tem atributo para
definir cabeçalhos. Logo uma rota protegida por `Bearer token` sempre devolveria
401 para elas. Por isso o `src` do player aponta para o caminho **estático
público** (`/uploads/episodes/audio/...`), e não para `/api/episodes/:id/stream`.
Consequência (a inconsistência da Shortz-App): a rota `/stream` é protegida, mas
o mesmo arquivo continua aberto em `/uploads` — a proteção da rota não protege o
arquivo. `express.static` também responde `Range`, então o seek funciona.

**3. Requisição `Range`.** É o cabeçalho com que o cliente pede só um pedaço do
arquivo (`Range: bytes=0-1023`). O servidor responde `206 Partial Content` com
`Content-Range: bytes 0-1023/TOTAL` e só esses bytes. Importa para mídia grande:
sem ele, cada seek (arrastar a barra) exigiria baixar o arquivo de novo desde o
início; com ele, o player pede só o trecho que quer ouvir, o que economiza banda
e dá início de reprodução/seek quase instantâneos.

**4. `offset = (page - 1) * limit`.** O cliente pensa em "página N"; o banco só
entende "pule X registros e traga `limit`". A página 1 pula 0, a 2 pula `limit`,
a 3 pula `2 * limit`... Ex.: `page=3&limit=8` → `offset = 16`: pula os 16 itens
das duas primeiras páginas e traz do 17º ao 24º. (A ordem `createdAt DESC, id
DESC` é fixa, para que o mesmo item não apareça em duas páginas.)

## Como conferir no navegador (Parte B)
Itens de interface (prints) feitos localmente por você — ver `checklists.md`.
Rodar: API (`npm run dev` em `podwaveapi`) e front (`npm run dev` em
`podwavefrontend`). Para o print `range-206.jpg`: DevTools → Network → filtro
"Media", tocar o episódio e arrastar a barra; a requisição para
`/uploads/episodes/audio/...` aparece com status **206**.
