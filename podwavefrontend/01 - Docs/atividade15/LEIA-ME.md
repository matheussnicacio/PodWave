# Atividade 15 — Painel de Administração

## Ficha (Seção 2)

| Nome | PodWave |
|---|---|
| Rota da lista de itens do painel | `GET /api/admin/episodes` |
| Rota de excluir pelo painel | `DELETE /api/admin/episodes/:id` |
| Função de excluir (com `isAdmin`) | `episodeService.deleteEpisode(id, userId, isAdmin = false)` |
| Campo de texto da busca de itens | `title` |
| Id do item nas denúncias | `episodeId` |
| Chave do item no Dashboard | `episodes` |
| Telas e rotas do front | `AdminDashboardView`, `AdminReportsView`, `AdminUsersView`, `AdminPodcastsView` / `admin-dashboard`, `admin-reports`, `admin-users`, `admin-podcasts` (nomes da Aula 06, mantidos) |
| Textos do painel | "Episódios", "Excluir episódio", "Denunciado por @...", "N denúncias pendentes" |
| Chaves do `localStorage` | `podwave_token` / `podwave_user` |
| Contas de teste | `admin`, `usuario_a`, `usuario_b`, `usuario_c` (senha `senha123`, e-mail `<username>@podwave.com`) |

## Arquivos desta pasta

- `testes-curl-atividade15.sh`: os nove testes da Etapa 5 (Parte A). Roda em `podwaveapi/` com a API no ar;
  chama `scripts/setAdmin.js` para promover e rebaixar. Com `DB="mysql -u ... podwave_db"` faz também as conferências no banco.
- `testes-api-saida.txt`: saída de uma execução completa (todos os resultados esperados).
- `teste-controle-saida.txt`: os testes de controle (a) e (b) da Etapa 4, feitos e desfeitos.
- `banco-denuncias-saida.txt`: `SHOW CREATE TABLE reports` e a contagem por situação.
- `respostas.md`: as dez respostas (rascunho: reescreva com as suas palavras).

## Prints

- **Tela:** `guarda-comum.jpg`, `guarda-localstorage.jpg`, `dashboard.jpg`, `denuncias-lista.jpg`, `revisar-lenta.jpg` (Slow 3G),
  `pulo-paginacao.jpg` (`PAGE_SIZE = 2` temporário), `usuarios-busca.jpg`, `bloquear-modal.jpg`, `bloqueado-selo.jpg` (extra),
  `bloqueado-login.jpg`, `itens-excluir.jpg`.
  Capturados com navegador automatizado (Chromium) sobre o app rodando de verdade (API + MySQL/MariaDB + Vite).
  Abaixo de cada tela, um painel com o que foi registrado: requisições à API (o que a aba Network mostraria) e observações.
- **Banco:** `banco-denuncias.jpg`.
- **Controle:** `controle-bloqueio.jpg` (a) e `controle-isadmin.jpg` (b).
- **Curls da Etapa 5:** `curl-01-sem-token-comum.jpg` … `curl-09-regressao.jpg`.

## Decisões

- O `middlewares/auth.js` exporta o `isAuthenticated` como antes (`module.exports = isAuthenticated`) e também como
  propriedades (`.isAuthenticated`, `.isAdmin`). As rotas antigas continuam com `require('../../middlewares/auth')`, sem alteração.
- O interceptor do Axios deixou de mostrar o toast "sessão expirada" no 401: o enunciado pede Login **sem toast** tanto para a
  sessão expirada quanto para a conta bloqueada (o motivo do bloqueio aparece no formulário de Login).
- A Sidebar não foi alterada: o link "Admin" (só para administrador) já apontava para `/admin`, que agora redireciona para o Dashboard.
