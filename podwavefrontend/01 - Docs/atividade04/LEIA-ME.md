# Atividade 04 — pendências que dependem de você

Todo o código (backend e frontend) já está implementado, testado aqui via
`curl` (Parte A) e validado com `npm run build` + Vite dev server (Parte B).
Faltam apenas os artefatos que só podem ser gerados rodando o projeto na
**sua** máquina, com seu navegador:

1. **Prints dos curls da Parte A** (`.jpg`, um pra cada teste do checklist).
   Comandos exatos para reproduzir (com a API rodando em `localhost:4000`):

   ```bash
   # 1) Login com sucesso
   curl -X POST http://localhost:4000/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"SEU_EMAIL","password":"SUA_SENHA"}'

   # 2) Senha errada -> 500 genérico
   curl -i -X POST http://localhost:4000/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"SEU_EMAIL","password":"senha-errada"}'

   # 3) /profile/me sem token -> 401
   curl -i http://localhost:4000/api/profile/me

   # 4) /profile/me com token válido (troque SEU_TOKEN pelo token do passo 1)
   curl -i http://localhost:4000/api/profile/me \
     -H "Authorization: Bearer SEU_TOKEN"

   # 5) /profile/me com token inválido -> 401
   curl -i http://localhost:4000/api/profile/me \
     -H "Authorization: Bearer token-invalido"
   ```

   Já validei esses 5 cenários rodando a API neste ambiente — todos com o
   comportamento exato esperado pelo checklist (ver `checklists.md`).

2. **`login-estilizado.jpg`** — print da tela `/login` com Bootstrap e a cor
   de marca (`#3D5AFE`) aplicados.

3. **Print do redirecionamento ao Login** — deslogado, digite na barra de
   endereço uma rota protegida (ex.: `http://localhost:5173/profile`) e tire
   o print mostrando a URL com `?redirect=/profile`.

4. **Print do Console com `Perfil autenticado OK:`** — logado, acesse
   `/profile` (Meu Perfil): a tela chama `GET /profile/me` com o token e
   loga esse texto no Console assim que a resposta chega.

5. **Print do logout automático** — logado, abra o DevTools → Application →
   Local Storage, edite o valor da chave `podwave_token` para qualquer coisa
   inválida, recarregue numa rota protegida (ex.: `/profile`) e tire o print
   mostrando que você foi jogado de volta para `/login`.

## Passo a passo rápido para rodar tudo localmente

1. `podwaveapi/`: crie o `.env` com `JWT_SECRET`, `JWT_EXPIRES_IN` (além das
   variáveis já existentes de PORT/CORS/DB) e rode `npm install && npm run dev`.
2. `podwavefrontend/`: confirme o `.env` com `VITE_API_URL` e rode
   `npm install && npm run dev`.
3. Abra `http://localhost:5173`, crie uma conta em `/register`, depois faça
   login em `/login` e siga os passos acima para os prints.
