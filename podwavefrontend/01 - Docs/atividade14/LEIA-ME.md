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

Prints pendentes (feitos por você): `sino-contador.jpg`, `polling-network.jpg`,
`lista-notificacoes.jpg`, `otimista-lida.jpg`, `rollback-lida.jpg`, `denuncia-modal.jpg`,
`denuncia-409.jpg`, `denuncia-toast.jpg`, `console-logout.jpg`, `banco-notificacoes.jpg`,
`controle-reports.jpg`, `controle-orfa.jpg` e um `.jpg` de cada curl.
