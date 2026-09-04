# Atividade 05 — pendências que dependem de você

Todo o código (backend e frontend) já está implementado e revisado aqui:
API testada sem banco de dados (rotas estáticas, guarda de autenticação e
sintaxe), e front-end validado com `npm run build` (sem erros de
sintaxe/import). Não há MySQL/MariaDB disponível neste ambiente, então os
testes que dependem de um usuário real (registro, login, `PUT /profile/me`
de verdade) precisam ser feitos na sua máquina.

## 1) Suba a API com seu banco local

```bash
cd podwaveapi
npm install
npm run dev
```

Confirme que `public/uploads/profiles/default-profile.png` existe (já vai
junto do repositório) e que a mensagem `Banco de dados sincronizado!`
aparece no terminal.

## 2) Testes da Parte A (prints dos curls)

Troque `SEU_TOKEN` pelo token devolvido no login (`POST /api/login`).

```bash
# 1) Login (pegue o token da resposta)
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"SEU_EMAIL","password":"SUA_SENHA"}'

# 2) Atualização sem foto (mantém a foto atual)
curl -i -X PUT http://localhost:4000/api/profile/me \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "fullName=Nome Atualizado" \
  -F "bio=Uma bio de teste"

# 3) Atualização com foto nova (troque o caminho pela sua imagem)
curl -i -X PUT http://localhost:4000/api/profile/me \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "fullName=Nome Atualizado" \
  -F "bio=Uma bio de teste" \
  -F "profilePicture=@/caminho/para/sua-foto.jpg"

# 4) Confirma que o arquivo servido publicamente responde 200
#    (troque <arquivo> pelo nome que voltou em profilePicture na resposta acima)
curl -i http://localhost:4000/uploads/profiles/<arquivo>

# 5) Bio acima de 255 caracteres -> 400
curl -i -X PUT http://localhost:4000/api/profile/me \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "fullName=Nome Atualizado" \
  -F "bio=$(python3 -c "print('a'*300)")"
```

Tire um print `.jpg` de cada um desses 5 comandos.

## 3) Prints do front-end

Com a API e o front (`npm run dev` em `podwavefrontend/`) rodando, e o
`.env` do front com `VITE_API_URL` e `VITE_UPLOADS_URL` apontando para
`http://localhost:4000` (veja `.env.example` abaixo):

1. Navegue a partir da LandingPage (sem digitar URL na mão), faça login e
   clique em "Perfil" na Navbar.
2. **`perfil-carregado.jpg`** — print da tela já carregada com seus dados reais.
3. **`preview-local.jpg`** — abra a aba Network do DevTools, escolha uma foto
   no input e tire o print mostrando a prévia circular atualizada e
   nenhuma chamada nova na aba Network.
4. **`uploadmultipart.jpg`** — clique em "Salvar alterações" e, na aba
   Network, abra a requisição `PUT /profile/me` → aba Headers → print
   mostrando `Content-Type: multipart/form-data; boundary=...`.
5. **`navbar-link-perfil.jpg`** — print da Navbar com o link "Perfil"
   visível (logado).

## `.env` do front-end (não versionado)

```
VITE_API_URL=http://localhost:4000/api
VITE_UPLOADS_URL=http://localhost:4000
```

## `.env` da API (não versionado, além do que já existia desde a Aula 01/04)

Nenhuma variável nova nesta aula — `PORT`, `CORS_ORIGIN`, `DB_*`,
`JWT_SECRET` e `JWT_EXPIRES_IN` continuam as mesmas.
