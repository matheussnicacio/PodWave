# Checklists — Atividade Aula 01 (PodWave)

## PARTE A — Backend

### Etapa 1 — Setup do ambiente
- [x] `node -v` e `npm -v` conferidos
- [x] Pasta `api/` criada, separada da pasta do front
- [x] `package.json` gerado

### Etapa 2 — Dependências e scripts
- [x] `express`, `cors`, `dotenv`, `morgan` instalados como dependências
- [x] `nodemon` instalado como devDependency
- [x] Scripts `start` e `dev` configurados no `package.json`

### Etapa 3 — Estrutura de pastas
- [x] Pastas `bin/`, `config/`, `middlewares/`, `modules/`, `routes/` criadas
- [x] `.gitignore` criado com `node_modules/` e `.env`

### Etapa 4 — Padrão único de resposta
- [x] `middlewares/apiResponse.js` criado com as funções `success` e `error`

### Etapa 5 — Rota GET /api
- [x] `routes/index.js` criado, com `name`/`message` adaptados ao PodWave
- [x] Campo `data.status` escrito exatamente assim (minúsculo, sem variação)

### Etapa 6 — CORS
- [x] `.env` criado com `PORT` e `CORS_ORIGIN` corretos

### Etapa 7 — app.js e bin/www
- [x] `app.js` criado, montando `indexRouter` sob o prefixo `/api`
- [x] `bin/www` criado
- [x] `npm run dev` sobe o servidor sem erros, exibindo a mensagem de confirmação

### Etapa 8 — Testando a API isoladamente
- [x] `curl http://localhost:4000/api` responde o JSON esperado

## PARTE B — Frontend

### Etapa 1 — Verificação e criação do projeto
- [x] API confirmada no ar via curl
- [x] `npm run dev` abre a página em `http://localhost:5173`

### Etapa 2 — Organização de pastas e variáveis de ambiente
- [x] Estrutura de pastas criada (`views/`, `components/`, `router/`, `services/`, `stores/`)
- [x] `.env` criado com `VITE_API_URL` apontando para a API
- [x] `.gitignore` configurado

### Etapa 3 — Vue Router
- [x] Tabela de tradução "funcionalidade → tela" preenchida (ver `Funcionalidades-e-Telas.md`)
- [x] Uma tela placeholder criada para cada linha da tabela
- [x] `src/router/index.js` criado com todas as rotas do sistema
- [x] Router registrado em `main.js`
- [x] Navegação manual pelas rotas conferida no navegador *(fazer localmente e confirmar)*

### Etapa 4 — Layout base
- [x] `TheNavbar.vue`, `TheSidebar.vue` e `TheFooter.vue` criados
- [x] Layout montado em `App.vue`, com `<router-view />` no lugar certo
- [x] Conferido visualmente que Navbar/Sidebar/Footer permanecem fixos ao navegar *(fazer localmente)*

### Etapa 5 — Consumindo a API (marco visual)
- [x] `LandingView.vue` implementada consumindo `VITE_API_URL`
- [x] Landing Page exibindo "Status da API: online" — **confirmar rodando localmente e tirar print** (`landing-status.jpg`)
- [x] Erro de CORS reproduzido e corrigido intencionalmente, com prints do Console/Network (`erro-cors.jpg`)

## Pendências que dependem de você (não automatizáveis por aqui)
- [x] Print `curl-api.jpg` do terminal rodando o curl
- [x] Print `landing-status.jpg` da Landing Page com "online"
- [x] Print `erro-cors.jpg` do teste de CORS proposital
- [x] Explicar com suas palavras: API REST, endpoint, verbos HTTP, status codes e CORS

# #############################################################################################################################################################################################
**API REST**: forma padronizada de comunicação via HTTP, onde tudo é tratado como "recursos" acessados por URLs, sem que o servidor guarde memória entre requisições.

**Endpoint**: a URL específica que dá acesso a um recurso ou ação (ex.: `http://localhost:4000/api`).

**Verbos HTTP**: dizem o que fazer com o endpoint — `GET` (buscar), `POST` (criar), `PUT`/`PATCH` (atualizar), `DELETE` (remover).

**Status codes**: números que indicam o resultado da requisição — `2xx` sucesso, `3xx` redirecionamento, `4xx` erro do cliente, `5xx` erro do servidor.

**CORS**: segurança aplicada pelo **navegador** (não pela API), que bloqueia respostas de origens não autorizadas explicitamente pelo servidor via cabeçalho `Access-Control-Allow-Origin` — mesmo que a API tenha processado a requisição normalmente.
# ###############################################################################################################################################################################################

# IMAGENS
![CURL-API](/podwavefrontend/01%20-%20Docs/imagens/curl-api.png)
![LANDING-STATUS](/podwavefrontend/01%20-%20Docs/imagens/landing-status.jpg)
![ERRO-CORS](/podwavefrontend/01%20-%20Docs/imagens/erro-cors.jpg)
![CORRECAO-ERRO-CORS](/podwavefrontend/01%20-%20Docs/imagens/correcao-erro-cors.jpg)
# Checklists — Atividade Aula 02 (PodWave)

## PARTE A — Backend (Trilha API / Módulo de Busca)

### Etapa 1 — Módulo search
- [x] Pasta `modules/search/` criada
- [x] `searchService.js` criado, com `podcasts` no lugar de `videos`

### Etapa 2 — Controller
- [x] `searchController.js` criado, usando `exports.search = ...`
- [x] Objeto retornado usa `podcasts`, igual ao service

### Etapa 3 — Rota
- [x] `searchRoutes.js` criado, com `router.get('/search', searchController.search)`

### Etapa 4 — Registro em app.js
- [x] `searchRoutes` importado no topo de `app.js`
- [x] `app.use('/api', searchRoutes)` adicionado
- [x] API reinicia sem erros (validado localmente aqui: `node ./bin/www` subiu sem erro)

### Etapa 5 — Teste isolado (validado rodando a API neste ambiente)
- [x] `curl ".../api/search?q=teste"` →
      `{"success":true,"message":null,"data":{"query":"teste","podcasts":[],"users":[]}}`
- [x] `curl ".../api/search"` (sem `q`) → `"query":""`
- [x] `curl .../api` continua respondendo normalmente

## PARTE B — Frontend (Camada de Comunicação com a API)

### Etapa 1 e 2 — Instância única do Axios + Interceptor
- [x] `src/services/api.js` com `axios.create(...)` usando `VITE_API_URL`
- [x] Interceptor de resposta adicionado (sucesso / `error.response` / `error.request` / erro de montagem)
- [x] Comentário nas próprias palavras no topo do arquivo, explicando os três ramos

### Etapa 3 — Services
- [x] `authService.js` criado com `register`, `login`, `logout` (ainda sem uso)
- [x] `searchService.js` criado, usando `params: { q: query }`
- [x] `systemService.js` criado

### Etapa 4 — Landing Page refatorada
- [x] `LandingView.vue` usando `getApiStatus()` em vez de `fetch`
- [x] `npm run build` do front concluído sem erros neste ambiente (validação de sintaxe/imports)

### Etapa 5 — Validando a camada com a busca
- [x] Cenário de sucesso validado aqui via script Node reproduzindo `api.js`:
      `Status da API: online` e `Busca OK: { query: 'a', podcasts: [], users: [] }`
- [x] Cenário de erro de rede validado aqui (API desligada): mensagem do interceptor
      "Não foi possível se conectar ao servidor..." — não um erro técnico bruto
- [x] Bloco de teste temporário do `search('a')` recolocado na Landing Page, prints tirados
      e removido de novo — **fazer localmente** (ver `atividade02/LEIA-ME.md`)

## Pendências que dependem de você (não automatizáveis por aqui)
- [x] Print `curl-search.png` de `curl ".../api/search?q=teste"`
- [x] Print `busca-ok-console.png` do Console mostrando `Busca OK: ...`
- [x] Print `erro-rede-console.png` do erro de rede provocado de propósito
- [x] Explicar com suas palavras (oralmente/por escrito, se pedido): por que Route/Controller/Service
      ficam em arquivos separados; o que é um interceptor do Axios; a diferença entre o `.data`
      do Axios e o `data` do envelope da API

# Checklists — Atividade Aula 03 (PodWave)

## Antes de começar — Ficha de preparação
- [x] Nome do banco de dados MySQL: `podwave_db`
- [x] Campo de contagem de itens publicados: `episodesCount`

## PARTE A — Backend

### Etapa 1 — Instalando as dependências de hoje
- [x] `sequelize`, `mysql2`, `bcryptjs`, `express-validator` instalados (conferido em `package.json`)

### Etapa 2 — Preparando o Banco de Dados MySQL
- [x] Banco de dados `podwave_db` criado no MySQL *(conferir localmente)*
- [x] `.env` atualizado com `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` *(arquivo ignorado pelo git — conferir localmente)*
- [x] `config/database.js` criado

### Etapa 3 — config/constants.js
- [x] `config/constants.js` criado com `USERNAME_MIN`, `USERNAME_MAX`, `PASSWORD_MIN`

### Etapa 4 — O Módulo user
- [x] `userModel.js` criado, com `episodesCount` no lugar de `videosCount`
- [x] `userValidator.js` criado
- [x] `userService.js` criado, com `getPublicProfile` também usando `episodesCount`
- [x] Senha (nem o hash) nunca é devolvida em nenhuma resposta (`registerUser` retorna só `id`/`username`/`email`)
- [x] `middlewares/asyncHandler.js` criado
- [x] `middlewares/errorHandler.js` criado
- [x] `userController.js` e `userRoutes.js` criados, ambos batendo com o modelo do roteiro

### Etapa 5 — Registrando o Módulo e o errorHandler em app.js
- [x] `userRoutes` e `errorHandler` importados e registrados em `app.js`, na ordem certa (errorHandler por último)
- [x] Terminal exibe "Banco de dados sincronizado!" ao subir a API *(confirmar localmente)*
- [x] Tabela `users` existe no MySQL, com todas as colunas do Model *(confirmar localmente)*

### Etapa 6 — Testando
- [x] Cadastro com sucesso responde `201` com `{ id, username, email }` *(rodar localmente)*
- [x] Senha curta responde `400` com a mensagem correta *(rodar localmente)*
- [x] Cadastro duplicado responde `500` (esperado, não é bug) *(rodar localmente)*
- [x] `GET /profile/:username` confirma os dados persistidos *(rodar localmente)*

## PARTE B — Frontend

### Etapa 2 — Conferindo a Navbar
- [x] Link "Criar Conta" para `/register` presente e navegável em `TheNavbar.vue`

### Etapa 3 — Formulário Controlado
- [x] `RegisterView.vue` com formulário controlado via `v-model` em todos os campos
- [x] `errors` e `apiErrorMessage` preparados no `<script setup>`

### Etapa 4 — Validação Client-Side
- [x] `validate()` replica exatamente os limites de `config/constants.js` (usuário 3–20, senha mínima 6)
- [x] Mensagens de erro aparecem/desaparecem corretamente conforme o usuário corrige os campos *(conferir no navegador)*

### Etapa 5 — Integrando com a API
- [x] `handleSubmit` chama `register()` de `authService.js`, trata sucesso (redireciona a `/login`) e erro (`apiErrorMessage`)
- [x] Envio vazio não dispara nenhuma chamada de rede *(conferir na aba Network)*
- [x] Cadastro válido navega para `/login` *(conferir localmente)*
- [x] Cadastro duplicado exibe `apiErrorMessage` com a mensagem vinda da API *(conferir localmente)*

### Etapa 6 — Teste Prático e Confirmação Fora do Navegador
- [x] Os cinco comportamentos do roteiro testados e conferidos *(fazer localmente)*
- [x] `curl http://localhost:4000/api/profile/<username>` confirma o cadastro feito pela tela *(fazer localmente)*

## Pendências que dependem de você (não automatizáveis por aqui)
- [x] Ficha markdown atualizada (com `podwave_db` e `episodesCount`) salva em `01 - Docs/atividade03/`
- [x] Print `tabelausers.jpg` do MySQL mostrando a tabela `users`
- [x] Prints dos 4 curls: `curl-cadastro-sucesso.jpg`, `curl-erro-validacao.jpg`, `curl-erro-duplicidade.jpg`, `curl-profile.jpg`
- [x] Print `registro-erros.jpg` do formulário exibindo erros de validação client-side
- [x] Print `registro-duplicidade-network.jpg` da aba Network mostrando status `500`
- [x] Explicar com suas palavras: o que é um ORM e o que `sync({ alter: true })` faz de fato; por que a senha nunca é salva em texto puro e como `bcrypt.hash`/`bcrypt.compare` resolvem isso; por que uma função `async` que lança erro precisa de `asyncHandler`; por que existe validação nos dois lados e qual delas decide se o dado é aceito

EXPLICAÇÃO ORM 

1. ORM / sync({ alter: true })
Um ORM (Sequelize, no caso) traduz classes JS em tabelas SQL, então uso User.create(...) em vez de escrever INSERT INTO. sync({ alter: true }) compara o Model com o banco e cria/ajusta a tabela automaticamente, sem eu escrever CREATE/ALTER TABLE na mão.

2. Senha nunca em texto puro
Se o banco vazar, a senha real fica exposta. O hash (bcrypt.hash) é de mão única — não dá pra reverter. No login, uso bcrypt.compare(senhaDigitada, hashSalvo), que refaz o hash da senha digitada e compara os dois hashes, nunca a senha original.

3. asyncHandler
Erro dentro de uma função async vira uma rejeição de Promise, que o Express não captura sozinho — a requisição ficaria pendurada. asyncHandler chama next(erro) manualmente quando isso acontece, mandando o erro pro errorHandler.

4. Validação nos dois lados
Front valida só por UX (feedback instantâneo, sem gastar chamada de rede) — mas pode ser ignorada, já que qualquer um pode chamar a API direto. Quem decide de verdade é a validação do backend (express-validator), porque é a única camada que o cliente não controla.
# Checklists — Atividade Aula 04 (PodWave)

## Antes de começar — Ficha de preparação
- [x] Cor de marca do projeto (hex): `#3D5AFE` (ver `atividade04/ficha.md`)

## PARTE A — Backend: Login, JWT e Middleware de Autenticação

### Checklist das tarefas
- [x] `jsonwebtoken` instalado
- [x] `.env` atualizado com `JWT_SECRET` e `JWT_EXPIRES_IN` *(arquivo ignorado pelo git — conferir localmente; ver `atividade04/LEIA-ME.md`)*
- [x] `config/jwt.js` criado, com carregamento/validação do `.env`, geração (`generateToken`) e verificação (`verifyToken`) de tokens
- [x] `middlewares/auth.js` criado (`isAuthenticated`)
- [x] `userService.js` atualizado com `loginUser` e `getUserProfile`
- [x] `userValidator.js` atualizado com `loginValidator`
- [x] `userController.js` atualizado com `login`, `logout`, `getMyProfile`
- [x] `userRoutes.js` atualizado, com `/profile/me` antes de `/profile/:username`

### Checklist dos testes (todos rodados aqui, com MySQL/MariaDB local e API real)
- [x] Login com sucesso devolve `token` e `user` (incluindo `isAdmin`)
- [x] Senha errada devolve `500` com mensagem genérica (`E-mail ou senha inválidos.`)
- [x] `GET /profile/me` sem token devolve `401`
- [x] `GET /profile/me` com token válido devolve os dados do usuário
- [x] `GET /profile/me` com token inválido devolve `401`

## PARTE B — Frontend: Login, Pinia e Proteção de Rotas

### Checklist das tarefas
- [x] `createPinia()` registrado em `main.js`, antes de `.use(router)`
- [x] `stores/auth.js` criado/atualizado, com persistência via `localStorage` (`podwave_token` / `podwave_user`)
- [x] Interceptor de requisição anexando `Authorization` quando existe token (`services/api.js`)
- [x] Interceptor de resposta limpando a sessão e redirecionando em qualquer `401`
- [x] Os nomes de chave batem exatamente entre `services/api.js` e `stores/auth.js` (compartilhados via `utils/storageKeys.js`)
- [x] Bootstrap 5 (CSS + JS bundle) incluído via CDN em `index.html`
- [x] `assets/main.css` criado, com a cor de marca (`#3D5AFE`) sobrescrevendo as variáveis `--bs-primary` do Bootstrap
- [x] Telas novas (`LoginView.vue`, `MyProfileView.vue`) usam classes Bootstrap; telas das Aulas 01–03 permanecem como estavam
- [x] Tela de Login funcional, chamando `authStore.login(...)`
- [x] Destino padrão pós-login ajustado para a rota `feed` (rota principal do PodWave)
- [x] Guarda de rota (`router/index.js`, `router.beforeEach`) bloqueando acesso direto a rotas com `requiresAuth: true`
- [x] `useAuthStore()` chamado dentro do callback do guarda, não no topo do arquivo
- [x] Navbar (`TheNavbar.vue`) mostra links diferentes conforme `authStore.isAuthenticated`
- [x] Logout (`authStore.logout()`) limpa a sessão e redireciona ao Login

### Checklist de testes
- [x] `npm run build` do front concluído sem erros neste ambiente (validação de sintaxe/imports/circularidade)
- [x] Login funcional testado end-to-end aqui via Vite dev server + API real → sessão persistida corretamente
- [x] Login funcional → redireciona à tela principal do seu projeto *(confirmar visualmente no navegador)*
- [x] F5 na página logado → sessão persiste (confira `localStorage` no DevTools) *(fazer localmente)*
- [x] Logout → tentar acessar rota protegida pela URL deve redirecionar ao Login com `?redirect=...` *(fazer localmente)*
- [x] Login a partir dessa tela redirecionada → deve voltar exatamente para a rota original *(fazer localmente)*
- [x] Editar o token no `localStorage` manualmente e recarregar rota protegida → redireciona ao Login (prova do interceptor de 401) *(fazer localmente)*

## Pendências que dependem de você (não automatizáveis por aqui)
- [x] Ficha em markdown com a cor de marca salva em `atividade04/ficha.md`
- [x] Prints de cada `curl` da Parte A, em `.jpg` (comandos prontos em `atividade04/LEIA-ME.md`)
- [x] Print `login-estilizado.jpg` da tela de Login com Bootstrap/cor de marca
- [x] Print do redirecionamento ao Login com `?redirect=...` na URL
- [x] Print do Console mostrando `Perfil autenticado OK:`
- [x] Print do logout automático após editar o token manualmente
- [x] Explicar com suas palavras: o que é um JWT (as três partes; o que é assinado vs. só codificado) e por que o payload nunca deve conter dados sensíveis; por que "logout" num sistema JWT stateless não revoga nada no servidor — e o que mudaria isso; por que ler o token do `localStorage` direto no interceptor do Axios evita dependência circular entre arquivos

EXPLICAÇÃO — JWT, Logout stateless e dependência circular

**1. O que é um JWT**
Um JWT tem três partes separadas por ponto: `header.payload.signature`. O
header e o payload são só codificados em Base64 (qualquer um decodifica sem
precisar de chave nenhuma — dá pra colar em jwt.io e ler). A signature é a
única parte realmente *assinada*: é um hash do header+payload usando o
`JWT_SECRET`, que só o servidor conhece. É essa assinatura que garante que
ninguém alterou o conteúdo do token depois que ele foi emitido — se alguém
editar o payload, a assinatura não bate mais na verificação. Por isso o
payload nunca pode conter dado sensível (senha, dados bancários etc.):
"assinado" não é "secreto", é só "à prova de adulteração".

**2. Por que logout não revoga nada num sistema stateless**
A API não guarda nenhuma tabela de "sessões ativas" — cada requisição prova
quem é o usuário só com o token que ela mesma carrega (por isso "stateless").
O endpoint `POST /logout` não tem nada pra apagar no servidor: o token
continua matematicamente válido até a data de expiração (`JWT_EXPIRES_IN`),
mesmo que o usuário "saia". Quem realmente encerra a sessão é o front-end,
descartando o token do `localStorage`. Pra revogar de verdade no servidor,
seria preciso guardar estado (ex.: uma tabela/lista de tokens invalidados —
uma "blocklist" — consultada em `isAuthenticated` a cada requisição, ou
tokens de vida bem curta trocados por um refresh token que pode ser
revogado), o que tira a API da categoria "stateless".

**3. Por que ler o token do localStorage direto no interceptor evita dependência circular**
A store de autenticação (`stores/auth.js`) importa o `authService.js` para
chamar `login`/`logout`, e o `authService.js` importa `api.js` (a instância
do Axios) pra montar as chamadas. Se `api.js` também importasse a store pra
ler `useAuthStore().token`, se fecharia um ciclo: `auth.js` → `authService.js`
→ `api.js` → `auth.js`. Módulos em ciclo dependem uns dos outros pra
terminar de inicializar, e isso pode fazer um dos dois ser importado "pela
metade" (com `undefined` no lugar do que ainda não foi exportado), quebrando
de um jeito difícil de depurar. Lendo o token direto do `localStorage`
dentro do interceptor, `api.js` não precisa importar nada do Pinia — só um
módulo neutro (`utils/storageKeys.js`) que não importa nada, quebrando o
ciclo.

# Checklists — Atividade Aula 05 (PodWave)

## PARTE A — Backend: Upload de Arquivos com Multer

### Checklist das tarefas
- [x] Pasta `public/uploads/profiles/` criada, com um `default-profile.png` dentro
- [x] `multer` instalado
- [x] `BIO_MAX: 255` adicionado a `config/constants.js` (dentro de `VALIDATION`, específico para o campo `bio`, que é `STRING(255)` no `userModel.js` — não reaproveita `USERNAME_MAX` nem nenhuma outra constante pensada para outro campo)
- [x] `middlewares/profileMulter.js` criado (`diskStorage`, nomes únicos por upload, `fileFilter` restringindo a `image/jpeg`, `image/png`, `image/webp`, limite de 5MB)
- [x] `require('path')` e a linha de `express.static('/uploads', ...)` adicionados em `app.js`, antes das rotas da API
- [x] `profileUpdateValidator` (`userValidator.js`), `updateUserProfile` (`userService.js`), `updateProfile` (`userController.js`) e a rota `PUT /profile/me` (`userRoutes.js`) criados, na ordem `isAuthenticated → profileMulter.single('profilePicture') → profileUpdateValidator → controller`
- [x] `errorHandler.js` ajustado para devolver `400` (em vez do `500` genérico) quando o erro vem do multer (`err.name === 'MulterError'`, ex.: arquivo maior que 5MB)

### Checklist dos testes
- [x] Testado aqui, sem banco de dados real: API sobe sem erro, `GET /uploads/profiles/default-profile.png` responde `200`, `PUT /profile/me` sem token responde `401` (guarda de rota funcionando antes mesmo de chegar no multer/validador)
- [x] Atualização sem foto funciona, mantendo a foto atual *(precisa do seu MySQL local — não há banco disponível neste ambiente)*
- [x] Atualização com foto nova funciona, e a foto antiga (se não era a padrão) é removida do disco *(idem)*
- [x] Bio acima de 255 caracteres é recusada com `400` *(idem)*

## PARTE B — Frontend: Formulário Multipart e a Tela de Meu Perfil

### Checklist desta etapa
- [x] Link para a tela de perfil visível na Navbar, só quando logado — **já existia** desde a Aula 04 (`TheNavbar.vue`, rota `/profile` com `meta: { requiresAuth: true }`), conferido e mantido sem alterações
- [x] `.env` atualizado com `VITE_UPLOADS_URL` (além do `VITE_API_URL` já existente), `utils/media.js` criado — `getProfilePictureUrl(filename)` monta a URL pública da foto a partir da raiz do servidor (não de `VITE_API_URL`, que tem o sufixo `/api` e apontaria para o lugar errado)
- [x] `updateProfile(formData)` adicionada em `authService.js` — a única chamada de toda a aplicação a sobrescrever o `Content-Type` padrão (`multipart/form-data` em vez do `application/json` configurado em `api.js`)
- [x] `stores/auth.js`: ação `updateUser(user)` adicionada, para manter a sessão persistida em sincronia depois de um `PUT /profile/me` bem-sucedido
- [x] `MyProfileView.vue` reconstruída: carrega dados reais (`GET /profile/me`) ao montar, formulário de nome/bio com validação (nome obrigatório, bio até 255 caracteres, contador de caracteres), prévia de imagem local via `URL.createObjectURL` (sem chamada de rede), envio via `FormData` + `updateProfile(formData)`

### Checklist dos testes
- [x] `npm run build` concluído sem erros neste ambiente (validação de sintaxe/imports)
- [x] Tela carrega os dados reais do usuário ao montar *(confirmar visualmente, navegando a partir da LandingPage)*
- [x] Selecionar uma foto atualiza a prévia instantaneamente, sem chamada de rede *(conferir na aba Network)*
- [x] Salvar funciona, com e sem trocar de foto *(idem)*

## Pendências que dependem de você (não automatizáveis por aqui)
- [x] Rodar a API com seu MySQL/MariaDB local e confirmar de ponta a ponta os 4 testes da Parte A (sem banco de dados disponível neste ambiente, não dá pra gerar usuário/token reais)
- [x] Print `perfil-carregado.jpg` — tela de Meu Perfil carregada com dados reais
- [x] Print `preview-local.jpg` — prévia de imagem antes do envio, com a aba Network sem nenhuma chamada nova
- [x] Print `uploadmultipart.jpg` — aba Network mostrando `Content-Type: multipart/form-data; boundary=...` da requisição de salvamento
- [x] Print `navbar-link-perfil.jpg` — Navbar mostrando o link "Perfil" visível quando logado
- [x] Prints de cada `curl` da Etapa 7 (Parte A) — comandos prontos em `atividade05/LEIA-ME.md`
- [x] Explicar com suas palavras: o que é `multipart/form-data` e por que um arquivo não cabe, na prática, dentro de um corpo JSON; por que `api.js` não muda nesta aula, mesmo upload de arquivo exigindo um `Content-Type` diferente do padrão configurado nele; por que validar um campo contra uma constante "de nome parecido, mas pensada para outra coisa" é um erro sutil — e como perceber isso antes de acontecer

EXPLICAÇÃO O QUE É MULTIPART 

1. multipart/form-data e por que arquivo não cabe em JSON
JSON só representa texto (strings, números, booleanos, listas, objetos). Um arquivo é bytes binários — para caber num JSON, precisaria virar texto primeiro (base64), o que infla o tamanho em ~33% e exige codificar/decodificar dos dois lados. multipart/form-data evita isso dividindo o corpo da requisição em "partes" separadas por um boundary: campos de texto vão puros, e o arquivo vai com seus bytes originais, sem conversão nenhuma.

2. Por que api.js não muda
Só uma chamada de toda a aplicação (updateProfile) precisa de multipart/form-data — todo o resto continua usando JSON. Por isso o Content-Type é sobrescrito apenas naquela chamada específica (passando um config extra no api.put(...)), em vez de mudar o padrão da instância inteira. O boundary em si é calculado e anexado pelo próprio navegador, não por mim.

3. Por que reaproveitar uma constante parecida é um erro sutil
USERNAME_MAX e o limite da bio só coincidem em valor, não em significado — um é limite de UX pra nome de usuário, o outro é o tamanho físico da coluna no banco (STRING(255)). Se eu reaproveitasse a constante errada, o bug ficaria escondido até alguém mudar USERNAME_MAX por outro motivo, quebrando a validação da bio sem querer. Por isso criei BIO_MAX separada: cada campo evolui de forma independente, sem efeito colateral nos outros. A regra geral: antes de reaproveitar uma constante, perguntar se ela representa o mesmo conceito ou só coincide em número.

# Checklists — Atividade Aula 06 (PodWave)

## PARTE A — Backend: Checkpoint de Consistência (Sem Código Novo)

### Checklist das tarefas
- [x] `checkpoint-01.md` criado e respondido, salvo em `atividade06/`
- [x] Todos os endpoints já construídos continuam respondendo como esperado — nenhuma linha de backend foi alterada nesta atividade, então não há regressão possível *(subir a API localmente com MySQL e conferir, se quiser confirmação extra)*

## PARTE B — Frontend: Componentização e Consistência Visual

### Checklist das tarefas
- [x] `bootstrap-icons` incluído via CDN em `index.html`, junto do Bootstrap 5 já existente
- [x] Os três componentes-base criados em `src/components/base/`: `BaseInput.vue` (usa `defineModel()`), `BaseButton.vue`, `FormCard.vue`
- [x] As três telas refatoradas para usar `BaseInput` / `BaseButton` / `FormCard`: `LoginView.vue`, `RegisterView.vue`, `MyProfileView.vue`
- [x] Tela de Registro agora visualmente consistente com Login/Perfil — usa `FormCard` com a mesma cor de marca (`--podwave-brand`, `.podwave-auth-card`), sem nenhuma cor nova introduzida
- [x] `composables/useAuth.js` criado, centralizando o acesso a `useAuthStore()` (usuário, `isAuthenticated`, `isAdmin`, `login`, `logout`, `updateUser`)
- [x] Guarda de rota (`router/index.js`) atualizado para usar `useAuth()` em vez de `useAuthStore()` direto
- [x] `TheNavbar.vue` atualizado para usar `useAuth()`
- [x] `TheSidebar.vue` atualizado para usar `useAuth()` — os três links (Meus Podcasts, Notificações, Admin) já existiam e já tinham suas rotas protegidas por `meta: { requiresAuth }`/`requiresAdmin`; a Sidebar só passou a refletir visualmente essa mesma regra (Admin some para quem não é admin), sem nenhum link novo apontando para funcionalidade ainda não construída
- [x] `npm run build` concluído sem erros neste ambiente, validando sintaxe/imports dos componentes e do composable novos

### Checklist de testes
- [x] Cadastro → confirmar o redirecionamento ao Login, com a tela agora estilizada *(fazer localmente)*
- [x] Login → confirmar o redirecionamento à tela principal *(fazer localmente)*
- [x] Navbar → confirmar a troca correta entre estado logado/deslogado *(fazer localmente)*
- [x] Edição de Perfil → confirmar que os três comportamentos da Atividade 05 (dados reais, edição, upload de foto) continuam funcionando, agora passando pelos componentes-base *(fazer localmente, com MySQL rodando)*
- [x] Guarda de rota → deslogado, tentar acessar a URL de uma tela protegida diretamente → confirmar o redirecionamento ao Login *(fazer localmente)*
- [x] Console do DevTools sem nenhum erro novo durante todo o teste *(fazer localmente)*

## Pendências que dependem de você (não automatizáveis por aqui)
- [x] Print `registro-antes.jpg` (tela de Registro sem estilo) e `registro-depois.jpg` (com `FormCard`/Bootstrap aplicado), em `atividade06/`
- [x] Print `tres-telas-consistentes.jpg` — Registro, Login e Perfil lado a lado, em `atividade06/`
- [x] Print da Navbar reagindo ao estado logado/deslogado, em `atividade06/`
- [x] Rodar os cinco testes acima localmente (API + MySQL) e confirmar sem erros no Console
- [x] Gerar os dois `.zip` de entrega (backend e frontend, sem `node_modules`)
- [x] Explicar com suas palavras: a diferença entre um componente (`BaseInput`) e um composable (`useAuth`); o que `defineModel()` resolve e por que evita repetir a dança manual de `props`/`emit`; por que uma tela nova (link na Navbar/Sidebar) só deve ser adicionada quando a funcionalidade que ela representa já existir, ou tiver uma aula futura clara para isso

EXPLICAÇÃO — Componente vs. Composable, defineModel() e links novos na navegação

**1. Componente vs. composable**
Um componente (`BaseInput`, `BaseButton`, `FormCard`) sempre produz um
pedaço de `<template>` — ele desenha algo na tela. Um composable
(`useAuth`) é só uma função que empacota lógica com estado (aqui,
`computed()` em cima do Pinia) para ser reaproveitada por vários lugares
diferentes — ele não desenha nada sozinho, só devolve dados/funções para
quem chamou usar no próprio template. `BaseInput` sem `<template>` não
funcionaria; `useAuth()` sem `<template>` é exatamente o ponto.

**2. O que `defineModel()` resolve**
Antes do `defineModel()`, um componente que quisesse suportar `v-model`
precisava declarar `props: ['modelValue']` e `emits: ['update:modelValue']`
na mão, e no template escrever `:value="modelValue"` +
`@input="$emit('update:modelValue', $event.target.value)"` — essa dança
inteira repetida em todo componente novo. `defineModel()` gera essa prop e
esse emit por baixo dos panos: `const model = defineModel()` já devolve
uma referência reativa de duas vias, então `v-model="model"` no
input/textarea interno é suficiente, e quem usa `BaseInput` de fora
continua escrevendo `v-model="form.email"` normalmente, sem saber que por
dentro isso virou prop+emit.

**3. Por que um link novo só entra quando a funcionalidade existe**
Um link na Navbar/Sidebar é uma promessa para quem está navegando: "clique
aqui, tem algo funcionando do outro lado". Adicionar um link para uma tela
que ainda não foi construída (ou que só existe como placeholder vazio)
quebra essa promessa e mistura duas coisas que deveriam ficar separadas: o
que o projeto *já entrega* hoje, e o que está *planejado* para uma aula
futura. Por isso a Sidebar desta atividade não ganhou nenhum link novo —
só passou a esconder, quando deslogado, links que já existiam e cujas
rotas já eram protegidas pelo guarda de rota desde antes.

# Checklists — Atividade Aula 07 (PodWave)

## Antes de começar — Ficha de preparação
- [x] Model: `Episode` / tabela: `episodes` / Grupo **A** (áudio + capa) —
      ficha completa em `atividade07/ficha.md`

## PARTE A — Backend: Model, Associação e Upload

### Checklist das tarefas
- [x] Pastas `public/uploads/episodes/audio/` e `public/uploads/episodes/covers/`
      criadas pelo próprio `episodeMulter.js` na primeira execução
- [x] `TITLE_MAX: 100` e `DESCRIPTION_MAX: 500` adicionados a `VALIDATION`
      em `config/constants.js` (nenhuma das duas existia ainda neste
      projeto, apesar do enunciado supor `DESCRIPTION_MAX` desde a Aula 05
      — como não existia, foi criada agora, do mesmo jeito que `BIO_MAX`
      foi criada na Aula 05: constante própria, não reaproveitada de outro
      campo)
- [x] `episodeModel.js` criado, Grupo A: campos `audio` e `cover`, além de
      `title`, `description` e `userId`
- [x] `config/associations.js` criado: `User.hasMany(Episode)` /
      `Episode.belongsTo(User)`
- [x] `middlewares/episodeMulter.js` criado, coerente com o Grupo A:
      `multer.fields([{ name: 'audio' }, { name: 'cover' }])`, com
      `fileFilter` e pasta de destino diferentes por `fieldname`
- [x] `episodeValidator.js`, `episodeService.js`, `episodeController.js` e
      `episodeRoutes.js` criados
- [x] Ordem de middlewares na rota conferida:
      `isAuthenticated → episodeMulter.fields([...]) → episodeUploadValidator → controller`
- [x] Rota `POST /episodes` montada em `app.js` (`app.use('/api', episodeRoutes)`)
- [x] `require('./config/associations')` chamado em `app.js`, antes de
      `sequelize.sync({ alter: true })`
- [x] Tabela `episodes` confirmada no banco, com FK `user_id`
      *(confirmar localmente, ver `atividade07/LEIA-ME.md`)*

### Checklist desta etapa
- [x] Upload completo funciona e `episodesCount` do usuário sobe —
      **validado aqui de ponta a ponta** (API + MariaDB reais, neste
      ambiente): `201 Created`, `episodesCount` subiu de 0 para 2 após dois
      uploads de sucesso seguidos. Print ainda precisa ser tirado na sua
      máquina (ver `atividade07/LEIA-ME.md`)
- [x] Cada um dos quatro casos de erro é recusado com o status esperado —
      **validado aqui**: sem título `400`, sem áudio `400`, sem capa `400`,
      sem token `401`. Print de cada um ainda precisa ser tirado na sua
      máquina (ver `atividade07/LEIA-ME.md`)

## PARTE B — Frontend: Formulário, Progresso e Alcançabilidade

### Checklist das tarefas
- [x] `services/episodeService.js` criado, recebendo `onUploadProgress`
      como parâmetro (repassado direto para o `config` do Axios)
- [x] `.progress-bar` e `.thumbnail-preview` adicionadas a `assets/main.css`
- [x] Formulário completo em `UploadView.vue`, adaptado ao Grupo A: título,
      descrição, arquivo de áudio, arquivo de capa
- [x] Barra de progresso funcionando, calculada a partir de
      `progressEvent.loaded` / `progressEvent.total` do `onUploadProgress`
- [x] Prévia de imagem da capa funcionando (`URL.createObjectURL`, sem
      chamada de rede)
- [x] Link "Publicar" já existia na Navbar desde antes desta aula
      (`TheNavbar.vue`, dentro do bloco `v-if="isAuthenticated"`) — conferido
      e mantido sem alterações, já satisfazia o requisito de visibilidade
- [ ] Resposta ao checklist de alcançabilidade escrita, junto com a entrega
      *(ver seção abaixo)*

### Checklist desta etapa
- [ ] Login → clique no link "Publicar" → confirmar a URL mudando sem
      recarregar a página *(fazer localmente)*
- [ ] Envio vazio → confirmar os erros de campo obrigatório *(fazer localmente)*
- [ ] Escolher só um dos dois arquivos → confirmar o erro pedindo o outro
      *(fazer localmente)*
- [ ] Escolher os arquivos corretamente → confirmar a prévia da capa, sem
      nenhuma chamada de rede *(fazer localmente)*
- [ ] Enviar → observar a barra de progresso avançar → confirmar a mensagem
      de sucesso *(fazer localmente)*
- [ ] DevTools → Network → confirmar
      `Content-Type: multipart/form-data; boundary=...` *(fazer localmente)*
- [ ] Confirmar no banco (ou via Postman/curl) que o registro foi criado e
      `episodesCount` subiu *(fazer localmente)*

## Pendências que dependem de você (não automatizáveis por aqui)
- [x] Ficha de preparação salva em `atividade07/ficha.md`
- [ ] Print `formulario-preenchido.jpg`
- [ ] Print `progresso-upload.jpg` (ou `.mp4`)
- [ ] Print `upload-multipart.jpg`
- [ ] Print `link-envio.jpg`
- [ ] Print de cada `curl` da Etapa 8 (Parte A) — comandos prontos em
      `atividade07/LEIA-ME.md` (atenção: use `;type=audio/mpeg` no campo do
      áudio, senão o próprio `curl` manda o Content-Type errado sozinho —
      detalhe explicado no início do `LEIA-ME.md`)
- [ ] Resposta escrita ao checklist de alcançabilidade da Etapa 4
- [ ] Gerar os dois `.zip` de entrega (backend e frontend, sem `node_modules`)

EXPLICAÇÃO — Associação explícita, multer.single vs multer.fields, e onUploadProgress

**1. Por que a associação precisa ser declarada explicitamente, e por que
centralizar isso evita referência circular**
A FK `userId` já existe como coluna comum no `episodeModel.js`, mas, para o
Sequelize, uma coluna chamada `userId` é só um inteiro qualquer — nada nela
diz "isso aponta para outra tabela". `User.hasMany(Episode)` e
`Episode.belongsTo(User)` são o que ensina isso ao Sequelize: só depois
dessas linhas existem os métodos automáticos (`user.getEpisodes()`,
`episode.getUser()`, o `include` para trazer o autor junto do episódio) e
só assim o `sync({ alter: true })` sabe criar a FK de verdade no banco, com
sua constraint. Se essa declaração ficasse dentro dos próprios models
(`User.hasMany(Episode)` dentro do `userModel.js`, `Episode.belongsTo(User)`
dentro do `episodeModel.js`), cada arquivo precisaria dar `require` no
outro para enxergá-lo — e os dois fariam isso ao mesmo tempo, um esperando
o outro terminar de carregar primeiro. Isso é uma referência circular:
dependendo da ordem em que o Node resolve os `require`s, um dos dois
módulos seria importado "pela metade" (com `module.exports` ainda
incompleto), e a associação declarada com um valor `undefined` no lugar do
model. Um arquivo à parte (`config/associations.js`) que importa os dois
models já prontos e só então declara a relação entre eles nunca sofre
desse problema, porque os dois `require`s dos models terminam de rodar
antes de qualquer associação ser declarada.

**2. multer.single(...) vs. multer.fields([...])**
`multer.single('nomeDoCampo')` espera exatamente **um** arquivo, vindo de
um único campo nomeado, e o disponibiliza em `req.file` (singular) — é o
que `PUT /profile/me` usa, porque só existe um arquivo possível (a foto).
`multer.fields([{ name: 'audio' }, { name: 'cover' }])` espera **vários**
campos de arquivo diferentes na mesma requisição, cada um com seu próprio
nome, e os disponibiliza em `req.files` (plural), um objeto onde cada
chave é o nome do campo e o valor é sempre um array de arquivos (mesmo com
`maxCount: 1`, por isso `req.files.audio[0]`, não `req.files.audio`). O
projeto usa `fields([...])` porque o Grupo A exige dois arquivos
independentes (áudio + capa) na mesma publicação, cada um com seu próprio
`<input type="file">` no formulário e seu próprio nome de campo no
`FormData` — `single(...)` simplesmente não tem como representar "dois
arquivos, cada um com seu papel", só aceitaria o primeiro e ignoraria (ou
rejeitaria) o segundo.

**3. O que `onUploadProgress` do Axios recebe, e como virar porcentagem**
`onUploadProgress` é chamado várias vezes durante o envio do corpo da
requisição, cada vez recebendo um `ProgressEvent` do navegador. Dele, os
dois campos usados são `loaded` (quantos bytes do corpo já foram
efetivamente transmitidos até agora) e `total` (o tamanho total do corpo,
em bytes — presente quando o navegador consegue calculá-lo de antemão, o
que é o caso normal de um `FormData` com arquivos de tamanho conhecido).
A porcentagem exibível é só `Math.round((loaded / total) * 100)`: uma
razão simples entre o que já foi enviado e o total, convertida para um
número de 0 a 100 que vira diretamente a largura (`width`) da barra de
progresso no template.

