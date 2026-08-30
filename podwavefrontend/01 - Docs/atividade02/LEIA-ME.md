# Atividade 02 — pendências que dependem de você

Esta pasta foi criada para guardar os prints pedidos na Seção 15 do enunciado.
Eu não tenho como gerar screenshots reais de terminal/navegador, então falta
você tirar e salvar aqui os seguintes arquivos (mesmos nomes usados no README
do checklist, para bater com o que já existe da Aula 01):

- `curl-search.png` — print de `curl "http://localhost:4000/api/search?q=teste"`
  respondendo corretamente (eu já validei essa resposta rodando a API aqui:
  veja `{"success":true,"message":null,"data":{"query":"teste","podcasts":[],"users":[]}}`
  no checklists.md atualizado).
- `busca-ok-console.png` — print do Console do navegador (F12) mostrando
  `Busca OK: { query: 'a', podcasts: [], users: [] }`, gerado com o bloco de
  teste temporário do Bloco 14.1 do enunciado, na Landing Page.
- `erro-rede-console.png` — print do erro de rede provocado de propósito
  (com a API desligada), mostrando a mensagem amigável do interceptor
  ("Não foi possível se conectar ao servidor...") no lugar de um erro técnico
  do Axios.

Passo a passo rápido para gerar os dois últimos prints:
1. Suba a API (`npm run dev` em `podwaveapi/`) e o front (`npm run dev` em
   `podwavefrontend/`).
2. Adicione temporariamente, dentro do `onMounted` de `LandingView.vue`, o
   bloco do Bloco 14.1 do enunciado (`import { search } ...` + `search('a')`).
3. Abra `http://localhost:5173/`, abra o Console (F12) e tire o print de
   `Busca OK: ...`.
4. Pare a API (Ctrl+C no terminal dela) e recarregue a página — tire o print
   do erro de rede no Console.
5. Religue a API e remova o bloco de teste temporário da Landing Page (ele já
   foi removido no código entregue neste zip — só é preciso recolocá-lo
   temporariamente para tirar esses dois prints).
