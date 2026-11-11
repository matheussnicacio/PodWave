# Atividade 15 — Respostas

> Rascunho baseado no que foi implementado e testado no PodWave. Reescreva com as suas palavras antes de entregar.

**1. Autenticação × autorização; 401 × 403.**
Autenticação responde "quem é você?"; autorização responde "você pode fazer isto?". A API responde 401 quando não sabe quem
está pedindo: sem token, token inválido/expirado, conta apagada ou bloqueada (ex.: `GET /api/admin/dashboard` sem token).
Responde 403 quando sabe quem é, mas a pessoa não tem permissão: o 403 de dono da Aula 09 (a `usuario_a` tentando excluir
pela rota comum o episódio do `usuario_b`: "Você não tem permissão para alterar este episódio.") e o 403 de papel de hoje
(um usuário comum chamando qualquer rota `/api/admin/...`: "Acesso restrito a administradores.").

**2. Por que o `isAuthenticated` consulta o banco.**
O token é uma fotografia do login, válida até expirar (1 dia). Confiando só nele: um usuário bloqueado continuaria usando o
token antigo até ele vencer (foi o que o teste de controle (a) mostrou: B bloqueado, `/profile/me` com 200); um administrador
rebaixado continuaria entrando no painel, porque o `isAdmin: true` está gravado no payload; e uma conta apagada continuaria
"existindo" para a API. Com a consulta por chave primária a cada requisição, a mudança vale na próxima requisição. O custo é
uma consulta extra (barata, por chave primária) em toda rota autenticada. As outras duas alternativas: tokens de vida curta
com refresh token (o bloqueio vale quando o token curto vence) ou uma lista de tokens revogados (blacklist) consultada a cada requisição.

**3. Como se vira administrador.**
Pelo script `node scripts/setAdmin.js <username>` (e `... off` para rebaixar), rodado no servidor, com acesso ao `.env` e ao
banco. Não existe rota porque ela teria de ser protegida por alguém que já é administrador (o primeiro administrador nunca
existiria) ou ficaria aberta, e aí qualquer pessoa se promoveria. Promover é decisão de quem administra o servidor, não de
quem tem conta no site. Como o papel é lido do banco, o efeito é imediato, sem novo login (teste 2: token emitido antes da promoção → 200).

**4. Uma linha no `router.use`, e a ordem.**
`router.use('/admin', isAuthenticated, isAdmin)` protege tudo que começa com `/admin`, inclusive rotas que alguém criar
depois e até `/admin/rota-inexistente` (401/403 antes do 404, então quem não é administrador não descobre o que existe).
Com um `isAdmin` em cada rota, bastaria esquecer um para abrir um buraco. O `isAdmin` lê `req.user`, que só existe depois
do `isAuthenticated`; invertidos, `req.user` estaria vazio e todos, até o administrador, receberiam 403.

**5. A coluna `status`, a revisão idempotente e o `reload()`.**
A tabela `reports` já tinha 5 linhas. Uma coluna `NOT NULL` nova precisa de um valor para as linhas antigas: o
`defaultValue: 'pending'` fez o `sync({ alter: true })` gerar `ADD COLUMN ... NOT NULL DEFAULT 'pending'`, e as 5 ficaram
pendentes (o que é verdade). Revisar é idempotente porque o service só escreve se a denúncia ainda estava pendente: o
segundo PATCH responde 200 com o mesmo `reviewedAt` (teste 4). O `reload()` lê de volta o que o banco gravou: o `new Date()`
tem milissegundos, a coluna `DATETIME` não; sem o reload, a primeira resposta mostraria `...:33.734Z` e a segunda `...:33.000Z`.

**6. As duas checagens do bloqueio.**
No login (403) e no `isAuthenticated` (401). O login responde 403 porque a senha conferiu: a API sabe quem é a pessoa, só não
deixa entrar. Nas rotas é 401 porque o token deixou de identificar uma sessão válida: o front trata 401 limpando a sessão e
levando ao Login. A checagem do login vem depois da senha para não revelar, a quem só tem um e-mail, que a conta existe e
está bloqueada (senha errada de um bloqueado continua com "E-mail ou senha inválidos."). O bloqueio não apaga nada: os
episódios e o perfil público de B continuam visíveis (teste 6: perfil 200) e o desbloqueio devolve o acesso ao mesmo token.

**7. `escapeLike` extraído agora; a contagem sem include agrupado.**
Porque hoje ele ganhou um segundo e um terceiro uso (busca de usuários e de episódios no painel). Duas cópias de uma regra
de segurança divergem na primeira correção feita em só uma delas; extrair já evita o painel nascer com `%%` devolvendo
tudo. A lista de episódios faz duas consultas: a página normal (com o autor) e uma agrupada só com os ids da página
(`episodeId IN (...)`, `status = 'pending'`, `GROUP BY episode_id`, `raw: true`); um `Map` junta as duas e o episódio sem
denúncia fica com 0. Um include agrupado com `limit` faz o Sequelize montar uma subconsulta e o limite passar a contar linhas da junção.

**8. Os dois testes de controle.**
(a) Com o `if (user.isBlocked)` comentado, bloqueei B pelo painel e o token antigo de B continuou funcionando
(`/profile/me` 200, curtir 200); só o login recusava (403). Prova que o bloqueio só vale "na hora" por causa da checagem no
`isAuthenticated`. (b) Sem o `isAdmin` no `router.use`, a `usuario_a` (conta comum) recebeu 200 no Dashboard e na lista de
usuários, com os e-mails de todos. Prova que é aquela linha que separa "logado" de "administrador". Os dois foram desfeitos
(401 com a mensagem do bloqueio e 403 de volta). Ver `controle-bloqueio.jpg` e `controle-isadmin.jpg`.

**9. O que a guarda do front protege.**
Ela evita mostrar uma tela que não serve para a pessoa (usuário comum vai ao Feed com aviso). Não protege dado nenhum: lê o
`isAdmin` do `localStorage`. No experimento, editei `podwave_user` para `"isAdmin":true` e dei F5: a seção Admin apareceu e o
painel abriu, mas cada tela mostrou "Acesso restrito a administradores." e a rede mostrou 403 em `dashboard`, `reports`,
`users` e `episodes` (`guarda-localstorage.jpg`). Quem protege é a API, que confere o `isAdmin` do banco.

**10. Ações que esperam o servidor; o "pulo" da paginação.**
Curtir errado é inofensivo e desfazível; uma ação de moderação mostrada como feita sem estar feita engana o moderador (ele
segue adiante achando que bloqueou alguém ou tratou uma denúncia). Por isso a linha só muda com o que a API devolveu, o
modal só fecha no sucesso e há "Salvando..." enquanto espera (`revisar-lenta.jpg`). O pulo: com `PAGE_SIZE = 2`, carreguei a
página 1, revisei a primeira linha (ela sai da lista de pendentes no servidor) e cliquei "Carregar mais": a página 2 é
`OFFSET 2` sobre uma lista que encolheu, então o item que seria o primeiro da página 2 escorregou para a página 1, já
carregada, e nunca apareceu ("Violação de direitos autorais" em "Histórias do Cerrado"). "Atualizar" o trouxe de volta
(`pulo-paginacao.jpg`). O conserto (paginação por cursor) fica para a Aula 18.
