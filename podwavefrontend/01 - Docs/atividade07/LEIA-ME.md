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

> ⚠️ **Achado ao testar de verdade:** o `curl` não reconhece `.mp3` como
> `audio/mpeg` sozinho — por padrão ele manda
> `Content-Type: application/octet-stream` para esse arquivo, o que faz o
> `fileFilter` do `episodeMulter.js` rejeitar até o caso de **sucesso** com
> `400`. Isso não acontece pelo navegador (o `<input type="file">` do
> formulário já manda o mimetype certo sozinho) — é uma particularidade só
> do `curl`. Por isso, nos comandos abaixo, o campo de áudio é enviado como
> `audio=@arquivo.mp3;type=audio/mpeg` (o `;type=...` força o Content-Type
> certo). Todos os comandos abaixo já foram rodados aqui, contra a API e o
> MySQL reais, e os status batem exatamente com o esperado — é só trocar
> `SEU_TOKEN` e os caminhos de arquivo pelos seus.

Troque `SEU_TOKEN` pelo token devolvido no login (`POST /api/login`), e os
caminhos de arquivo pelos seus próprios arquivos de teste (um `.mp3` e uma
imagem).

```bash
# 1) Login (pegue o token da resposta)
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"SEU_EMAIL","password":"SUA_SENHA"}'

# 2) Upload completo, com sucesso -> 201 (testado aqui: 201 confirmado)
curl -i -X POST http://localhost:4000/api/episodes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "title=Episódio de teste" \
  -F "description=Descrição do episódio de teste" \
  -F "audio=@/caminho/para/seu-audio.mp3;type=audio/mpeg" \
  -F "cover=@/caminho/para/sua-capa.jpg;type=image/jpeg"

# 3) Caso de erro 1 — sem título -> 400 (testado aqui: 400 confirmado,
#    "O título é obrigatório.")
curl -i -X POST http://localhost:4000/api/episodes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "description=Sem título" \
  -F "audio=@/caminho/para/seu-audio.mp3;type=audio/mpeg" \
  -F "cover=@/caminho/para/sua-capa.jpg;type=image/jpeg"

# 4) Caso de erro 2 — sem o arquivo de áudio -> 400 (testado aqui: 400
#    confirmado, "O arquivo de áudio é obrigatório.")
curl -i -X POST http://localhost:4000/api/episodes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "title=Sem áudio" \
  -F "cover=@/caminho/para/sua-capa.jpg;type=image/jpeg"

# 5) Caso de erro 3 — sem a capa -> 400 (testado aqui: 400 confirmado,
#    "A imagem de capa é obrigatória.")
curl -i -X POST http://localhost:4000/api/episodes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "title=Sem capa" \
  -F "audio=@/caminho/para/seu-audio.mp3;type=audio/mpeg"

# 6) Caso de erro 4 — sem token -> 401 (testado aqui: 401 confirmado,
#    "Não autorizado. Token não informado.")
curl -i -X POST http://localhost:4000/api/episodes \
  -F "title=Sem token" \
  -F "audio=@/caminho/para/seu-audio.mp3;type=audio/mpeg" \
  -F "cover=@/caminho/para/sua-capa.jpg;type=image/jpeg"

# Extra — confirma que o áudio/capa ficaram acessíveis publicamente
# (troque pelos filenames que voltaram em "audio"/"cover" na resposta do item 2)
# (testado aqui: 200 confirmado nos dois)
curl -i http://localhost:4000/uploads/episodes/audio/<arquivo>.mp3
curl -i http://localhost:4000/uploads/episodes/covers/<arquivo>.jpg
```

Tire um print `.jpg` de cada um dos comandos 2 a 6 (os "quatro casos de
erro" pedidos no checklist são os itens 3, 4, 5 e 6).

Depois do item 2, confirme no MySQL (ou via
`curl http://localhost:4000/api/profile/me -H "Authorization: Bearer SEU_TOKEN"`)
que `episodesCount` do seu usuário subiu em 1 — testado aqui: subiu de 0
para 2 depois de dois uploads de sucesso seguidos.

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
