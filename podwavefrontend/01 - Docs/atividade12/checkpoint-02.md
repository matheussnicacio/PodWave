# Checkpoint 2 — Leitura guiada da API (PodWave)

> Entidade principal: **Episode** (na Shortz-App, "vídeo"). Service que cria o registro e mexe no
> contador do usuário: `episodeService.createEpisode` (contador `User.episodesCount`).
> Feed geral: `userController.getFeed`. Feed filtrado: `followController.getFollowingEpisodes`.
>
> **Nota de método:** o texto do "roteiro de API, Bloco 2.1 a 2.6" não estava disponível quando este
> arquivo foi escrito; as seis seções abaixo seguem os temas do enunciado (constantes, paginação,
> padrão de erro, transação, validação de id, camadas). Se a numeração do roteiro for outra, basta
> renomear os títulos — as evidências (arquivo:linha) continuam valendo. Linhas conferidas no commit
> desta atividade.

## 2.1 Números soltos nos módulos (valores mágicos)

| Pergunta | Resposta | Evidência |
|---|---|---|
| "Tamanho de página" solto em `modules/`? | **Não (depois da correção).** Os services só têm o *default* vindo de `PAGINATION`; os controllers usam `parsePagination`. | `episodeService.js:235` e `:264` (defaults), `userController.js:65`, `followController.js:61` |
| Limites de validação vêm de `config/constants.js`? | **Sim** para username/senha/bio/título/descrição/comentário (`VALIDATION.*`). | `userValidator.js`, `episodeValidator.js`, `commentValidator.js` |
| Algum limite escrito à mão fora de `constants`? | **Sim, 2 casos:** `bcrypt.genSalt(10)` e `fileSize: 50 * 1024 * 1024`. | `userService.js:~25`, `episodeMulter.js:74` |

## 2.2 Paginação

| Pergunta | Resposta | Evidência |
|---|---|---|
| Os dois feeds passam por uma função única de normalização? | **Sim, agora.** `utils/pagination.js → parsePagination`. | `utils/pagination.js` |
| `limit` tem teto? | **Sim:** `PAGINATION.MAX_LIMIT = 50`. | `config/constants.js:34-38` |
| `page`/`limit` negativos ou textos chegam ao banco? | **Antes, sim (erro 500); agora não.** Ver `paginacao-antes.txt` × `paginacao-depois.txt`. | — |
| Feed sem seguidos devolve `[]` sem consultar `IN ()`? | **Sim.** | `episodeService.js:271-273` |
| Ordenação estável (desempate por `id`)? | **Sim**, nos dois feeds. | `episodeService.js:243` e `:280` |

> Estado do repositório antes da atividade: o `parsePagination` já existia, mas **dentro do
> `episodeService`**, com `LIMIT_MAX` e `DEFAULT_LIMIT: 10`. A atividade o moveu para
> `utils/pagination.js`, renomeou para `MAX_LIMIT` e alinhou `DEFAULT_LIMIT` a 12. O "antes" dos
> prints foi reproduzido com o código ingênuo `Number(req.query.limit) || 12` (o problema que o
> enunciado descreve), numa cópia temporária da API.

## 2.3 Padrão de erro

- `const error = new Error(...)` / `error.status = N` / `throw error`: **25 ocorrências de `new Error(`
  em 13 arquivos** e **19 atribuições `.status = N`**. Arquivos: `userValidator`, `userService`,
  `followController`, `followService`, `likeService`, `episodeValidator`, `episodeService`,
  `commentValidator`, `commentService`, `episodeMulter`, `profileMulter`, `auth`, `config/jwt`
  (este último é erro de configuração, não de HTTP).
- Dois services (`followService.httpError` e, agora, `userService.httpError`) têm um *helper*; os
  demais repetem as três linhas. É uma repetição observada, não resolvida hoje (não entra na tabela
  da Seção 13 porque eu não tenho, no material, a aula em que ela será tratada — confirme no roteiro
  do Bloco 5 e, se não estiver lá, resolva-a antes de entregar).
- **Achado corrigido hoje:** `userService.loginUser` (senha errada) e `registerUser` (e-mail/usuário
  duplicado) lançavam `new Error(...)` **sem `status`** → o `errorHandler` respondia **500**.
  Agora: login inválido **401**, cadastro duplicado **409**.

## 2.4 Escritas duplas e transação

| Service | Escritas | Transação? | Evidência |
|---|---|---|---|
| `createEpisode` | episódio + `episodesCount` do autor | **Sim**, `{ transaction: t }` nas duas | `episodeService.js:73-84` |
| `deleteEpisode` | likes + comments + episódio + `episodesCount` | **Sim** | `episodeService.js:218-223` |
| `createComment` | comentário + `commentsCount` | **Sim** | `commentService.js:38-48` |
| `toggleLike` | like + `likesCount` | **Sim** (+ `lock UPDATE`) | `likeService.js:41-77` |
| `toggleFollow` | follow + 2 contadores | **Sim** (+ lock ordenado) | `followService.js:58-105` |
| `updateEpisode` | `save()` + apaga capa antiga do disco | Uma escrita no banco; disco **depois** | `episodeService.js:184-188` |

Resultado válido da leitura: **todas as escritas duplas já estavam em transação** (nenhuma alteração
foi necessária na Etapa 3). Teste: depois de publicar 14 episódios, `episodesCount` = 14; depois de
excluir 1, = 13 (`regressao-api-saida.txt`, blocos 01 e 09).

## 2.5 Validação de id e os três `curl`

Regex `/^\d+$/` repetida em **6 lugares** (`episodeService` ×3, `likeService`, `commentService`,
`followController`).

| Rota | Status |
|---|---|
| `GET /episodes/abc` | 404 |
| `POST /episodes/abc/toggle-like` | 404 |
| `GET /episodes/abc/comments` | 404 |
| `POST /users/abc/toggle-follow` | **400** |

**Os módulos não respondem com o mesmo status:** episódio/like/comentário tratam id inválido como
*não encontrado* (404); o módulo follow o trata como *requisição inválida* (400). Ambos são
defensáveis, mas a inconsistência é real.

## 2.6 Camadas

- Controllers só leem `req`, chamam o Service e usam `success(...)` — **sim**, nos 6 módulos.
- Services não conhecem `req`/`res` — **sim**.
- Todo handler assíncrono passa por `asyncHandler` — **sim** (rotas).

## Perguntas extras

1. **`new Error` + `status` + `throw`:** 25 / 13 arquivos (lista na Seção 2.3).
2. **Outro valor numérico solto em mais de um arquivo:** `255` e `500` aparecem nos **models**
   (`STRING(255)`, `STRING(500)`) **e** em `config/constants.js` (`BIO_MAX`, `DESCRIPTION_MAX`,
   `COMMENT_MAX`) — duplicação deliberada (o model é o limite do banco, a constante é a regra de
   negócio), mas os dois precisam mudar juntos.
3. **Três `curl` de id inválido:** respostas na tabela da Seção 2.5 — status **diferentes** (404 × 400).

## Seção 13 — Pendências próprias (ADR-013)

| O que é | Por que não foi resolvido hoje | Em qual aula será resolvido |
|---|---|---|
| `searchService.globalSearch` é um *stub* (devolve listas vazias) e `SearchView` é um placeholder | Não há consulta de busca para checar nem para consumir com `useAsyncData`; é funcionalidade nova, e hoje é um checkpoint sem funcionalidade nova | **Aula 13** (o próprio `searchService.js` registra que a busca real entra nessa trilha) |
