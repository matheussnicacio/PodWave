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
- [ ] Navegação manual pelas rotas conferida no navegador *(fazer localmente e confirmar)*

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

