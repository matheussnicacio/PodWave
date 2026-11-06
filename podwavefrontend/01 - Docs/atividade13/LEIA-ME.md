# Atividade 13 — Playlists, "Salvar" e Busca com Debounce

Coleção do PodWave = **Playlist** (lista pessoal de episódios de qualquer autor).

| Ficha | PodWave |
|---|---|
| Coleção | `Playlist` (tabela `playlists`) |
| Junção | `PlaylistEpisode` (tabela `playlist_episodes`) |
| Contador | `episodesCount` |
| Rotas | `/api/my-playlists`, `/api/playlists`, `/api/playlists/:id/episodes[/:episodeId]` |
| Status | `GET /api/episodes/:episodeId/playlists-status` → `hasEpisode` |
| Busca | `title` do episódio; `username`/`fullName` do usuário |
| Telas | `MyPlaylistsView`, `PlaylistDetailView`, `SearchView` |

Arquivos desta pasta:
- `testes-curl-atividade13.sh` — os 11 testes da Etapa 6 (Parte A). Uso no LEIA-ME do próprio script.
- `testes-api-saida.txt` — saída de uma execução completa (banco limpo).
- `teste-controle-contador.txt` — teste de controle da Etapa 5 (antes/depois).
- `respostas.md` — as oito respostas (rascunho: reescreva com as suas palavras).

Prints pendentes (feitos por você no navegador/cliente de banco): `colecao-privada.jpg`,
`salvar-modal.jpg`, `otimista-modal.jpg`, `rollback-modal.jpg`, `detalhe-colecao.jpg`,
`colecao-privada-visitante.jpg`, `debounce.jpg`, `busca.jpg`, `navbar-busca.jpg`,
`contador-controle.jpg`, `contador-certo.jpg`, `colecoes-banco.jpg` e um `.jpg` de cada curl.
