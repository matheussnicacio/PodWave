# Atividade 14 — Notificações e Denúncias

| Ficha | PodWave |
|---|---|
| Notificação | `Notification` (tabela `notifications`, módulo `notification`) |
| Denúncia | `Report` (tabela `reports`, módulo `report`) |
| Id do item | `episodeId` |
| Rota da denúncia | `POST /api/episodes/:episodeId/report` |
| Rotas de notificação | `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read` |
| Textos | "curtiu o seu episódio", "comentou no seu episódio", "começou a seguir você" |
| Tela e componente | `NotificationsView`, `ReportEpisodeModal` |
| Gatilhos | `toggleLike` (likeService), `createComment` (commentService), `toggleFollow` (followService) |

Arquivos desta pasta:
- `testes-curl-atividade14.sh`: os 11 testes da Etapa 5 (Parte A).
- `testes-api-saida.txt`: saída de uma execução completa.
- `teste-controle-saida.txt`: teste 8 (banco) e os testes de controle (a) e (b) da Etapa 4.
- `respostas.md`: as dez respostas (rascunho: reescreva com as suas palavras).

Prints:
- Tela: `sino-contador.jpg`, `lista-notificacoes.jpg`, `otimista-lida.jpg` (Slow 4G), `rollback-lida.jpg` (Offline),
  `denuncia-modal.jpg`, `denuncia-409.jpg`, `denuncia-toast.jpg`, `polling-network.jpg`, `console-logout.jpg`.
  Capturados com navegador automatizado (Chromium); abaixo de cada tela, um painel com o que foi registrado
  (requisições à API, mensagens do Console, aria-label lido do DOM).
- Banco: `banco-notificacoes.jpg` (tabelas, índices, `ENUM`, `SHOW CREATE TABLE` e as duas recusas).
- Controle: `controle-reports.jpg` (500 da chave estrangeira de `reports`) e `controle-orfa.jpg` (notificação com `episode_id` NULL).
- Curls da Etapa 5: `curl-01-sem-token.jpg` … `curl-11-regressao.jpg` (o 08 é o teste no cliente de banco).
