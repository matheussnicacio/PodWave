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