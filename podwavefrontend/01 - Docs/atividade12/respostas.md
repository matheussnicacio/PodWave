# Atividade 12 — Respostas (rascunho para você reescrever com as suas palavras)

**1. Por que `useAsyncData` recebe `() => minhaChamada()` e não `minhaChamada()`?**
Porque `minhaChamada()` executa a requisição na hora e entrega uma promessa já pronta: o composable
não conseguiria repeti-la ("Tentar de novo", `refresh`), nem refazê-la quando o `:id` da rota muda,
nem numerá-la para descartar respostas antigas. Com a função, quem decide *quando* chamar é o
composable — ele a chama uma vez ao montar e de novo a cada `watch`/`execute`.

**2. O que é a corrida entre respostas e como o `lastCallId` a evita?**
O usuário abre o episódio 1 e, antes de ele carregar, o episódio 2. Se a resposta do 2 chega primeiro
e a do 1 chega depois, a tela passa a mostrar o episódio 1 sob a URL do 2 (ou o *loading* some antes
da hora). `lastCallId` é um contador: cada chamada guarda o seu número e, ao responder, só escreve em
`data`/`error`/`isLoading` se ainda for a última. As antigas são ignoradas. (Testado: a 1ª chamada lenta
terminou depois da 2ª e `data` ficou com a resposta da 2ª.)

**3. Quem avisa quando uma ação, uma leitura ou um formulário falha? Por que "toast para todo erro" seria erro de design?**
Ação (curtir, seguir, excluir) → toast, disparado pelo interceptor do Axios. Leitura (GET) → a própria
tela, no lugar do conteúdo, com "Tentar de novo" (`useAsyncData.error`). Formulário → o próprio
formulário, junto dos campos (`silent: true` nos services de formulário). Toast para tudo duplicaria o
aviso (toast + tela) e faria sumir em segundos um erro que pede ação do usuário (corrigir um campo).

**4. Por que a lista de toasts fica fora de `useToast()` (singleton) e que vantagem tem sobre o Pinia?**
Estando no escopo do módulo, todo `useToast()` devolve a *mesma* lista reativa: o `ToastContainer` e o
interceptor do Axios (que não é componente) enxergam o mesmo estado. Uma store do Pinia exigiria um Pinia
ativo e puxaria `api.js` para o ciclo store → service → api → store; para uma lista simples, sem
persistência, é cerimônia sem ganho.

**5. `?limit=-3`, `Number.parseInt('abc') >= 1` e o teto do `limit`.**
`limit=-3` chegava ao banco como `LIMIT -3` e dava erro de SQL (500); `page=-2` gerava `OFFSET` negativo.
`Number.parseInt('abc')` é `NaN` e `NaN >= 1` é `false`, então lixo cai sozinho no padrão, sem `if`
especial. O teto (`MAX_LIMIT = 50`) impede `?limit=100000` de forçar o banco a devolver a tabela inteira.
E é `>= 1`, não `> 1`: com `> 1`, `limit=1` cairia no padrão e `page=2&limit=1` devolveria a lista errada.

**6. Por que o miolo da atualização otimista não foi extraído hoje? O que é a "regra dos três"?**
Hoje há só duas ocorrências (`LikeButton` e `FollowButton`) e elas diferem (estado próprio × `defineModel`,
contador de outra parte da tela). Extrair com duas cópias é adivinhar a abstração; com a terceira dá para
ver o que realmente é comum. "Regra dos três": duplique uma vez, na terceira ocorrência refatore. O que
era *comum de verdade* (a cerca de login e o `isBusy`) já foi extraído: `useAuthenticatedAction`.

**7. O que pode dar errado se o Service grava o registro e o contador do autor sem transação?**
Se a segunda escrita falha (ou o processo cai entre elas), fica o episódio sem o contador subir — ou o
contrário — e os números divergem dos dados para sempre. Pior: um comando esquecido sem `{ transaction: t }`
roda em outra conexão e não é desfeito pelo *rollback*. Com a transação, ou as duas escritas acontecem ou nenhuma.
