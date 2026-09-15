# Checkpoint 01 — Consistência do Backend (Aula 06, Parte A)

Revisão lado a lado dos dois módulos completos do projeto (`modules/search/` e
`modules/user/`). Nenhuma linha de código nova nesta etapa — só leitura e
resposta às perguntas do roteiro.

- [x] Alguma rota (`*Routes.js`) contém lógica de negócio, em vez de só
      declarar verbo + caminho + middlewares + controller?
      **Não.** `searchRoutes.js` só tem `router.get('/search', searchController.search)`.
      `userRoutes.js` só declara verbo + caminho + a cadeia de middlewares
      (`isAuthenticated`, `profileMulter`, os validators) + o controller
      correspondente. Nenhuma delas calcula nada nem acessa o Model.

- [x] Algum Controller consulta o Model diretamente, sem passar pelo Service?
      **Não.** `userController.js` só importa `userService` (nunca
      `userModel`) e cada função do controller é uma casca fina: pega dado
      de `req`, chama a função do Service correspondente, devolve com
      `success()`. `searchController.js` segue o mesmo padrão com
      `searchService`.

- [x] Algum Service faz referência a `req` / `res`?
      **Não.** `userService.js` e `searchService.js` recebem só os
      parâmetros primitivos de que precisam (`username`, `email`,
      `password`, `userId`, `{ fullName, bio, newProfilePictureFilename }`,
      `query`) — nunca o objeto de requisição/resposta inteiro. Quem monta
      a resposta HTTP é sempre o Controller.

- [x] Todo Controller usa `success()` / `error()` de `apiResponse.js`?
      **Sim, com a divisão esperada.** Todo retorno de sucesso dos dois
      controllers passa por `success()`. Nenhum controller chama `error()`
      diretamente — os dois lançam (`throw`) ou propagam o erro do
      Service/Model, e é o `errorHandler.js` central (registrado por
      último em `app.js`) quem chama `error()` uma única vez, no fim da
      cadeia. Ou seja: `success()` nos controllers, `error()` centralizado
      no `errorHandler` — consistente com o padrão desde a Aula 03.

- [x] Toda rota que chama uma função `async` está envolvida em `asyncHandler`?
      **Sim.** Em `userRoutes.js`, `register`, `login`, `logout`,
      `getMyProfile`, `updateProfile` e `getPublicProfile` são todas
      `async` e todas estão envolvidas em `asyncHandler(...)`. Em
      `searchRoutes.js`, `searchController.search` não é `async` (a Aula 02
      deixou isso documentado no comentário do `searchService.js`: ainda
      não existe banco para essa busca), então corretamente **não** está
      envolvida em `asyncHandler` — não teria erro nenhum de Promise para
      capturar ali.

- [x] Toda validação de entrada usa `express-validator`, sem nenhum `if`
      manual escondido?
      **Sim.** `registerValidator`, `loginValidator` e
      `profileUpdateValidator` usam só `body(...)` do `express-validator`.
      O único lugar com um `if` dentro de uma função é o
      `.custom((value, { req }) => { if (value !== req.body.password) ... })`
      de `confirmPassword` — mas esse `if` está *dentro* da própria API de
      validação customizada do `express-validator` (é a forma documentada
      de fazer validação cruzada entre campos), não é um `if` solto
      escondendo uma validação por fora da lib.

- [x] `config/constants.js` não tem nenhuma constante solta sem uso, nem
      nenhum valor de validação fora dela?
      **Confirmado.** `constants.js` só exporta `VALIDATION` com
      `USERNAME_MIN`, `USERNAME_MAX`, `PASSWORD_MIN` e `BIO_MAX` — as
      quatro são importadas e usadas em `userValidator.js`. Não há nenhum
      limite de validação escrito como número solto em nenhum outro
      arquivo do backend (buscado em `userValidator.js`, `userService.js`
      e `userModel.js`).

- [x] A constante de limite da bio (Aula 05) é usada exatamente uma vez, no
      lugar certo?
      **Sim.** `VALIDATION.BIO_MAX` aparece uma única vez em todo o
      backend, em `userValidator.js`, dentro de
      `body('bio').isLength({ max: VALIDATION.BIO_MAX })` — exatamente o
      campo que ela existe para limitar (bate com `bio: STRING(255)` em
      `userModel.js`). Nenhum outro campo (como `username`) reaproveita
      essa constante por engano.

## Conclusão

O padrão de camadas (Route → Controller → Service → Model) se manteve firme
nos dois módulos, sem nenhuma quebra encontrada nesta revisão. Nenhuma
alteração de código foi necessária na Parte A desta atividade.
