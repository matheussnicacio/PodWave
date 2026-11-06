# Atividade 13 — Respostas (rascunho para você reescrever com as suas palavras)

Nomes neste projeto: coleção = **Playlist**; junção = **PlaylistEpisode** (`playlist_episodes`);
contador = **episodesCount**; status = `GET /api/episodes/:episodeId/playlists-status` com **hasEpisode**.

**1. Por que muitos-para-muitos precisa de uma tabela de junção, e por que ela tem dois índices?**
Uma playlist tem vários episódios e um episódio pode estar em várias playlists. Uma coluna
`playlistId` em `episodes` só guardaria uma playlist por episódio (e vice-versa), então cada par
"episódio Y está na playlist X" vira uma linha em `playlist_episodes`. O índice único composto
`(playlist_id, episode_id)` impede o mesmo par duas vezes (o banco recusa com *Duplicate entry*) e
acelera as buscas que começam pela playlist: "os episódios da playlist X" e "X contém Y?". Como um
índice composto só serve a buscas pelo prefixo da esquerda, ele não ajuda "em quais playlists está
o episódio Y?" — é isso que o índice simples em `episode_id` cobre (o status do modal "Salvar" e a
limpeza quando o episódio é excluído).

**2. O que é idempotente, e por que adicionar duas vezes responde 200 e remover duas vezes responde 404?**
Uma ação é idempotente quando repeti-la deixa o sistema no mesmo estado que fazê-la uma vez.
"Garanta que o episódio está na playlist" é idempotente: na primeira vez a linha é criada (`201`,
`added: true`, contador +1); na segunda não há nada a fazer, o estado pedido já existe, então é um
sucesso sem mudança (`200`, `added: false`, contador intacto). Remover é diferente: o pedido é
"tire este episódio", e na segunda vez não existe nada para tirar — o recurso sobre o qual o pedido
age não existe, por isso `404`. O `destroy` devolve quantas linhas apagou, e 0 vira o `404`.

**3. Por que, mesmo com ON DELETE CASCADE, excluir um episódio deixa o contador errado sem o código descontar?**
O CASCADE apaga as linhas da junção, mas não sabe nada de `playlists.episodes_count`: para o banco
ele é só um número numa coluna. O contador é um dado **desnormalizado** (uma cópia derivada, guardada
para não fazer `COUNT(*)` a cada listagem), e manter a cópia em dia é responsabilidade do código.
No teste de controle (bloco comentado), a exclusão respondeu 200, a linha da junção sumiu, mas
`episodesCount` continuou em 2 com só 1 linha real (`teste-controle-contador.txt`). Restaurando o bloco,
o contador desce junto, na mesma transação.

**4. A ordem 400 → 404 → 403 e as duas opções para uma playlist privada de outra pessoa.**
Primeiro a entrada é válida? (`parseId`: "abc" → 400, sem tocar no banco.) Depois o recurso existe?
(404.) Só então "é seu?" (403) — não faz sentido falar de permissão sobre algo que não existe, e
checar a dona antes exigiria buscar o registro de qualquer jeito. Para ler uma playlist privada de
outra pessoa há duas escolhas: **403** ("existe, mas você não pode ver") é mais honesto e ajuda a
depurar; **404** ("não encontrada") esconde até a existência, o que vaza menos informação (ninguém
consegue descobrir quais ids são playlists privadas). Este projeto usa **403**, como o roteiro, e a
tela mostra "Esta playlist é privada."

**5. Por que `%%` devolvia tudo, como o escape resolve, e por que conferir `req.query.q` com `typeof`?**
No `LIKE`, `%` significa "qualquer sequência" e `_` "qualquer caractere". Buscar `%%` montava
`LIKE '%%%%'`, que casa com qualquer título. `escapeLike` troca cada `%`, `_` e `\` por `\%`, `\_` e
`\\`, e o MySQL passa a procurar o caractere literal: `%%` não acha nada. Quanto ao `typeof`:
`?q=ab&q=cd` chega como **array** e `?q[x]=1` pode chegar como **objeto**; `.trim()` neles lança
TypeError (erro 500). Só texto é aceito; o resto vira `''` e as listas voltam vazias.

**6. O que muda e o que não muda entre curtir, seguir e marcar playlist; por que `apply` devolve o desfazer?**
Não muda: aplicar na tela antes, chamar a API, acertar com o servidor no sucesso e desfazer no erro,
sem toast (é do interceptor) — isso virou `runOptimistic`. Muda: o que é aplicado (coração e contador;
botão e contador do cartão do perfil, via `defineModel`; a caixa e o contador de uma linha), qual
requisição sai (um toggle; ou adicionar/remover escolhido pelo estado de antes) e o que o servidor
confirma. `apply` devolve a função de desfazer porque só quem aplicou conhece o estado anterior: ele
fica guardado no fechamento da função, e o undo nunca fica dessincronizado do que foi feito.

**7. Debounce x `lastCallId`.**
São problemas diferentes. O **debounce** reduz quantas requisições saem: enquanto a pessoa digita, o
timer é reiniciado a cada tecla, e só uma pausa de 400 ms dispara a busca — "podcast" sem pausa é 1
requisição, não 7. O **`lastCallId`** (no `useAsyncData`) cuida da ordem das respostas: se duas buscas
saíram ("pod", pausa, "podcast") e a resposta da primeira chega por último, ela é descartada e a tela
não mostra o resultado de um termo antigo. Um não substitui o outro.

**8. Por que "Remover da playlist" é pessimista e a caixa do modal é otimista?**
A caixa é um interruptor barato e reversível: se falhar, ela volta e nada se perdeu — e a resposta
imediata importa (a pessoa pode marcar várias seguidas). Remover do detalhe tira um card inteiro da
tela: se sumir na hora e a API falhar, o card teria de "reaparecer", o que confunde (a pessoa já
seguiu adiante). Esperar a API também dá o contador real. Excluir/remover algo da tela é o caso em que
a confirmação vale a espera.
