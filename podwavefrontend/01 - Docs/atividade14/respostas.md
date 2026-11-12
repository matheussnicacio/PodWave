# Atividade 14 — Respostas (rascunho para você reescrever com as suas palavras)

Nomes neste projeto: `Notification` (tabela `notifications`), `Report` (tabela `reports`), id do item
`episodeId`, rota `POST /api/episodes/:episodeId/report`, textos "curtiu o seu episódio" /
"comentou no seu episódio", tela `NotificationsView` e modal `ReportEpisodeModal`.

**1. Por que a notificação nasce na mesma transação, e o que acontece se esquecer de repassar o `t`?**
O aviso é consequência da curtida (ou do comentário, ou do seguir): ou os dois existem, ou nenhum.
Se a curtida falhar depois de o aviso ser gravado (ou o contrário), sobraria "fulano curtiu" sem curtida.
Na mesma transação, um rollback desfaz tudo junto. Sem o `t`, o `Notification.create` roda em outra
conexão, fora da transação. Como a transação já travou linhas (o `lock` do episódio no curtir, os
usuários no seguir) e a outra conexão precisa delas, uma fica esperando a outra. O sintoma é a
requisição "pendurada" e, uns 50 s depois, um 500 "Lock wait timeout exceeded". A causa é um impasse
entre duas conexões, não um erro de SQL.

**2. As regras de uma notificação verdadeira.**
Um aviso só existe para contar a alguém algo que outra pessoa fez, e enquanto aquilo for verdade.
Ninguém precisa ser avisado do que acabou de fazer, por isso `createNotification` não faz nada quando
`userId === actorId` (curtir ou comentar o próprio episódio). Descurtir e deixar de seguir apagam o
aviso porque a ação deixou de existir, e "fulano curtiu" sobre uma curtida desfeita seria mentira. Comentar
não tem "desfazer": a API não tem rota para excluir comentários, então o comentário (e o aviso) continuam
sendo verdade.

**3. Por que `unread-count` é separada da lista, e o que cada índice de `notifications` acelera.**
O sino pergunta a cada 30 s, para cada pessoa logada. Ele só precisa de um número: um `COUNT` que não
traz linhas, joins com usuários e episódios nem fotos. Usar a lista para isso seria baixar uma página
inteira (e mesmo assim errar, porque a contagem passa de uma página). O índice `(user_id, is_read)`
cobre exatamente as duas consultas da pessoa: "as minhas" (o prefixo `user_id`, a lista) e "as minhas
não lidas" (as duas colunas, o contador). O índice em `episode_id` cobre a limpeza dos avisos quando um
episódio é excluído.

**4. Por que denunciar de novo é 409 (e não 200), e o que garante isso com dois cliques simultâneos.**
Na playlist, o pedido é um estado ("o episódio está nela"), e repetir chega ao mesmo estado: 200. A
denúncia é um registro de algo que a pessoa fez. A segunda tentativa conflita com o registro que já
existe, e a pessoa precisa saber disso ("Você já denunciou este episódio"), em vez de achar que mandou
uma segunda denúncia. Quem garante uma por pessoa, mesmo com dois cliques simultâneos, é o índice único
`(user_id, episode_id)`: o banco recusa a segunda linha (testado: `Duplicate entry '5-11' for key
'idx_unique_report_user_episode'`), e o `findOrCreate` devolve `created: false`, que vira 409.

**5. As duas defesas do motivo, e por que o banco guarda chaves e a tela mostra rótulos.**
A primeira é o validator (`isIn(REPORT.REASONS)`): responde 400 com mensagem clara antes de tocar no
banco (sem motivo, "chato" e até o rótulo "Spam ou golpes" no lugar da chave). A segunda é o `ENUM` da
coluna: se um bug ou outro cliente pular o validator, o banco recusa (`Data truncated for column
'reason'`). O banco guarda a chave (`spam`) porque ela é estável e independe de idioma: o texto da
tela pode mudar de "Spam ou golpes" para outra coisa sem reescrever nenhuma linha gravada, e a Aula 15
lê as mesmas chaves.

**6. CASCADE, NO ACTION e SET NULL, e o que o teste de controle mostrou.**
Ao excluir o pai, `CASCADE` apaga as filhas junto (as linhas de playlist da Aula 13). `NO ACTION`
recusa a exclusão enquanto houver filhas. `SET NULL` deixa as filhas e apaga só a ligação, pondo NULL
na coluna. Em `reports`, `episode_id` é obrigatório, então a FK nasceu `NO ACTION`. No teste (a), com o
`Report.destroy` comentado, excluir um episódio denunciado deu **500**: "Cannot delete or update a
parent row: a foreign key constraint fails (`reports`, ... ON DELETE NO ACTION)". Em `notifications`,
`episode_id` é opcional (o aviso de seguir não tem episódio), então a FK nasceu `SET NULL`. No teste
(b), com o `Notification.destroy` comentado, a exclusão deu **200**, mas sobrou a notificação 14 (`like`,
`episode_id NULL`): um "curtiu o seu episódio" sem episódio. Apaguei a linha órfã depois. Nos dois casos
o banco não limpa por nós; o código apaga as filhas antes do pai (`teste-controle-saida.txt`).

**7. Como o polling se mantém correto.**
30 s é um meio-termo: o aviso parece "quase ao vivo" e cada pessoa faz só duas requisições por minuto.
Quem liga e desliga é o `watch(isAuthenticated, ..., { immediate: true })` da Navbar: entrou na conta,
`startPolling()`; saiu, `stopPolling()`, que limpa o intervalo, remove o ouvinte e zera o número.
O `if (timerId !== null) return` impede um segundo `setInterval`: sem ele, logins repetidos (ou o
watch disparando de novo) empilhariam temporizadores, e só o último seria desligado. Com a aba
escondida, ninguém está olhando o sino, e abas esquecidas multiplicariam requisições à toa. Por isso
`refreshIfVisible` confere `document.visibilityState` e o `visibilitychange` pergunta na hora ao voltar.
Testado com o serviço simulado: três `startPolling` seguidos, um temporizador só; aba escondida, zero
requisições; ao voltar, uma imediata.

**8. A corrida do contador.**
O polling pergunta "quantas?" e a resposta demora. Nesse meio-tempo, a pessoa marca uma como lida e a
API devolve o número novo (2). Aí chega a resposta velha do polling (5), que foi calculada antes, e
sobrescreve o 2: o sino "desmarca" sozinho. O `lastRefreshId` numera cada pergunta, e só a resposta da
última pode escrever. `setUnreadCount` também sobe o `lastRefreshId` porque ela é uma escrita mais nova
que qualquer pergunta que já estava no ar: subir o número torna essas perguntas velhas, e a resposta
delas é ignorada. Testado: resposta velha (5) chegando depois do número novo (2), o sino continuou em 2.

**9. O quarto caso do `runOptimistic`.**
Não muda: aplicar já, chamar a API, confirmar com o servidor ou desfazer no erro, sem toast (é do
interceptor). Por isso `utils/optimistic.js` ficou intacto. Muda: há dois lugares a atualizar, a linha
e o sino (na store), e o `confirm` entrega à store o `unreadCount` real da API. O desfazer do sino é
relativo (`+1`) porque várias linhas podem estar em voo ao mesmo tempo. Com 5 não lidas, marco duas:
o sino vai a 4 e depois a 3. Se cada desfazer voltasse ao número que viu, a primeira voltaria a 5 e a
segunda a 4, e o sino ficaria em 4 (errado). Com +1 cada, 3 → 4 → 5, o número do começo.

**10. Por que o 400 do logout aparecia como erro de CORS.**
O logout mandava `api.post('/logout', null, ...)`, e o Axios enviava o texto `null` como JSON. O
`express.json()` (modo strict) só aceita objeto ou array e respondia 400 ali mesmo. Como o `cors` vinha
depois do `express.json()`, a requisição nunca chegava a ele, e o 400 saía sem
`Access-Control-Allow-Origin`. Sem esse cabeçalho, o navegador não deixa a página ler a resposta e
mostra um "erro de CORS" no lugar do 400 real. Movendo o `cors` para antes dos parsers, toda resposta
(até os erros deles) sai com o cabeçalho (testado: `400` com `Access-Control-Allow-Origin:
http://localhost:5173`). E trocando `null` por `undefined`, o logout nem manda corpo: Console limpo.
