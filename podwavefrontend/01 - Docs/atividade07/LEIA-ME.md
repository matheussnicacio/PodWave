# Atividade 07 — pendências que dependem de você

Todo o código (backend e frontend) já está implementado aqui: model
`Episode`, `config/associations.js`, upload com `multer.fields([...])`,
rota `POST /api/episodes` e o formulário completo no front (título,
descrição, áudio, capa, prévia, barra de progresso). O que falta é rodar
tudo com seu MySQL local, gerar os dados reais e tirar os prints pedidos
na Etapa 18 do enunciado.

## 1) Suba a API com seu banco local

```bash
cd podwaveapi
npm install
npm run dev
```

Confirme que apareceram as duas pastas novas em disco (o próprio multer
cria na primeira vez que rodar):

```
public/uploads/episodes/audio/
public/uploads/episodes/covers/
```

e que o terminal mostra `Banco de dados sincronizado!`, com a tabela
`episodes` criada no MySQL (com FK `user_id` apontando para `users`).

## 2) Testes da Parte A (prints de cada curl)

Troque `SEU_TOKEN` pelo token devolvido no login (`POST /api/login`), e os
caminhos de arquivo pelos seus próprios arquivos de teste (um `.mp3` e uma
imagem).

```bash
# 1) Login (pegue o token da resposta)
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"SEU_EMAIL","password":"SUA_SENHA"}'

# 2) Upload completo, com sucesso -> 201
curl -i -X POST http://localhost:4000/api/episodes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "title=Episódio de teste" \
  -F "description=Descrição do episódio de teste" \
  -F "audio=@/caminho/para/seu-audio.mp3" \
  -F "cover=@/caminho/para/sua-capa.jpg"

# 3) Caso de erro 1 — sem título -> 400
curl -i -X POST http://localhost:4000/api/episodes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "description=Sem título" \
  -F "audio=@/caminho/para/seu-audio.mp3" \
  -F "cover=@/caminho/para/sua-capa.jpg"

# 4) Caso de erro 2 — sem o arquivo de áudio -> 400
curl -i -X POST http://localhost:4000/api/episodes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "title=Sem áudio" \
  -F "cover=@/caminho/para/sua-capa.jpg"

# 5) Caso de erro 3 — sem a capa -> 400
curl -i -X POST http://localhost:4000/api/episodes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "title=Sem capa" \
  -F "audio=@/caminho/para/seu-audio.mp3"

# 6) Caso de erro 4 — sem token -> 401
curl -i -X POST http://localhost:4000/api/episodes \
  -F "title=Sem token" \
  -F "audio=@/caminho/para/seu-audio.mp3" \
  -F "cover=@/caminho/para/sua-capa.jpg"

# Extra — confirma que o áudio/capa ficaram acessíveis publicamente
# (troque pelos filenames que voltaram em "audio"/"cover" na resposta do item 2)
curl -i http://localhost:4000/uploads/episodes/audio/<arquivo>.mp3
curl -i http://localhost:4000/uploads/episodes/covers/<arquivo>.jpg
```

Tire um print `.jpg` de cada um dos comandos 2 a 6 (os "quatro casos de
erro" pedidos no checklist são os itens 3, 4, 5 e 6).

Depois do item 2, confirme no MySQL (ou via
`curl http://localhost:4000/api/profile/me -H "Authorization: Bearer SEU_TOKEN"`)
que `episodesCount` do seu usuário subiu em 1.

## 3) Prints do front-end

Com a API e o front (`npm run dev` em `podwavefrontend/`) rodando:

1. Faça login → clique no link **Publicar** na Navbar → confirme que a URL
   muda para `/upload` sem recarregar a página.
2. **`formulario-preenchido.jpg`** — preencha título, descrição, áudio e
   capa (confirme a prévia da capa aparecendo, sem nenhuma chamada de rede
   na aba Network) e tire o print antes de clicar em enviar.
3. **`progresso-upload.jpg`** (ou `.mp4`, se for rápido demais) — clique em
   "Publicar episódio" e capture a barra de progresso avançando.
4. **`upload-multipart.jpg`** — na aba Network, abra a requisição
   `POST /episodes` → aba Headers → print mostrando
   `Content-Type: multipart/form-data; boundary=...`.
5. **`link-envio.jpg`** — print da Navbar com o link "Publicar" visível
   (logado).
6. Tente enviar vazio → confirme os erros de campo obrigatório aparecendo
   sem chamada de rede.
7. Escolha só um dos dois arquivos → confirme que o erro pede o outro.
8. Após o envio, confirme a mensagem de sucesso e o redirecionamento.

## `.env` do front-end (não versionado, sem variável nova nesta aula)

```
VITE_API_URL=http://localhost:4000/api
VITE_UPLOADS_URL=http://localhost:4000
```

## `.env` da API (não versionado, sem variável nova nesta aula)

`PORT`, `CORS_ORIGIN`, `DB_*`, `JWT_SECRET` e `JWT_EXPIRES_IN` continuam os
mesmos das aulas anteriores.
