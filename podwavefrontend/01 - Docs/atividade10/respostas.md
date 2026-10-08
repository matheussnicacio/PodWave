# Atividade 10 — Respostas (PodWave)

> Rascunho com base no que está implementado neste repositório — revise e
> reescreva com as suas palavras antes de entregar.

**1. Por que "uma pessoa só curte uma vez" deve estar no banco (índice único composto) e não só no código**
No código eu posso fazer `if (!jaCurtiu) criar()`, mas entre o `if` e o `create` existe uma janela: dois cliques, duas abas ou duas requisições quase simultâneas passam pelo `if` ao mesmo tempo, os dois veem "não curtiu" e os dois gravam. Resultado: duas curtidas da mesma pessoa e o contador somando 2. O índice único composto (`user_id` + `episode_id`, em `likeModel.js`) é a única garantia que vale mesmo com concorrência, com outro cliente da API ou com um bug futuro: o banco recusa a segunda linha com `Duplicate entry`. Testei inserindo uma curtida repetida à mão e o banco recusou (`unique.jpg`).

**2. Contador guardado × contador calculado, e o risco do primeiro**
Contador calculado é um `COUNT(*)` sobre a tabela `likes` a cada leitura: nunca está errado, mas custa uma consulta por card. Contador guardado é a coluna `likes_count` no próprio episódio: a leitura é instantânea, mas existem duas "verdades" (a linha da curtida e o número) e elas podem divergir se uma escrita acontecer e a outra não (por exemplo, a linha entra, o servidor cai, e o contador nunca sobe). A transação elimina isso: criar/remover a linha e incrementar/decrementar o contador acontecem juntos (`COMMIT`) ou nenhum acontece (`ROLLBACK`).

**3. O que acontece se um comando dentro de `sequelize.transaction` esquecer `{ transaction: t }`**
Esse comando roda FORA da transação, em outra conexão do pool. Ele não é desfeito se a transação der rollback e também não enxerga o que a transação ainda não confirmou. Não dá erro nenhum: o resultado é um contador atualizado sem a linha correspondente (ou o contrário), justamente a divergência que a transação deveria evitar. Por isso todos os `create`, `destroy`, `increment`, `decrement` e `find` dentro de `toggleLike`, `createComment` e `deleteEpisode` levam `{ transaction: t }`.

**4. Atualização otimista: o que é, três passos e quando não usar**
É mostrar o resultado esperado na tela antes de a API responder, assumindo que vai dar certo, para a interface parecer instantânea (mesmo em Slow 4G). Os três passos (`LikeButton.vue`): (1) guardar o estado anterior (liked e contador); (2) aplicar a mudança na tela e só então chamar a API; (3) na resposta, se deu certo, ajustar ao valor real do servidor; se falhou, fazer rollback para o estado guardado e mostrar a mensagem de erro. Não deve ser usada quando falhar é comum ou o efeito é caro/irreversível (pagamento, exclusão definitiva, envio de e-mail), ou quando o resultado depende de uma regra que só o servidor conhece. Curtir é barato, reversível e quase sempre funciona, então é um bom caso.

**5. Por que o texto do comentário sai com `{{ }}` e nunca com `v-html`**
O texto do comentário é digitado por qualquer usuário. Com `{{ }}`, o Vue escapa o HTML: `<b>teste</b>` e `<img src=x onerror="alert(1)">` aparecem como texto puro. Com `v-html`, o navegador interpretaria isso como HTML de verdade, e o `onerror` executaria JavaScript no navegador de quem abre a página (XSS: roubo do token no `localStorage`, ações em nome da vítima etc.). As quebras de linha são preservadas só com CSS (`white-space: pre-wrap` em `.comment-text`), sem mexer no HTML.

**6. Por que `.trim()` precisa vir antes de `.notEmpty()`**
O express-validator executa a cadeia na ordem em que foi escrita. Com `.notEmpty().trim()`, um texto de três espaços (`"   "`) passa no `notEmpty()` (tem 3 caracteres) e só depois é aparado para `""`, chegando vazio ao banco. Com `.trim().notEmpty()`, o valor já é `""` quando o `notEmpty()` olha, e a requisição é recusada com `400`. O mesmo vale para `isLength`: ele precisa contar o texto já aparado. Corrigi isso em `registerValidator` (`username` e `fullName`) no `userValidator.js`; os validadores do episódio e do comentário já nasceram com `.trim()` primeiro.
