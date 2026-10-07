# Atividade 09 — Respostas (PodWave)

> Rascunho com base no que está implementado neste repositório — revise e
> reescreva com as suas palavras antes de entregar.

**1. 401 × 403 × 404, e por que "existe?" vem antes de "é seu?"**
`401` é "não sei quem você é" (sem token ou token inválido — barrado pelo
`isAuthenticated`). `403` é "sei quem você é, mas isso não é seu" (episódio de
outra conta). `404` é "isso não existe". A checagem de existência vem antes da
de dono porque o `403` só faz sentido para algo que existe: se eu respondesse
`403` para um id que não existe, e `404` só quando não houvesse nada, a
diferença entre as respostas revelaria quais ids existem. No código, isso está
em `findOwnedEpisode` (`episodeService.js`): primeiro `findByPk` → `404`, depois
`userId !== episode.userId` → `403`.

**2. Por que o banco é atualizado antes do disco**
Se eu apagasse o arquivo primeiro e o `save()`/`destroy()` falhasse, o registro
continuaria no banco apontando para um arquivo que não existe mais: o player e a
capa quebrariam e não haveria como recuperar. Na ordem certa (banco → disco),
o pior caso é a remoção do arquivo falhar e sobrar um arquivo solto no disco —
lixo, mas o sistema continua consistente. Por isso `updateEpisode` e
`deleteEpisode` só chamam `removeFile` depois do banco.

**3. O que é um arquivo órfão, exemplos e onde a limpeza acontece**
É um arquivo que está no disco mas que nenhum registro do banco referencia. O
Multer grava em disco *antes* de autenticação/validação/controller terminarem.
Exemplos no PodWave: (a) `PUT /episodes/:id` com capa nova feito por outra
conta → o Multer salva a capa e o serviço responde `403`; (b) `PUT` ou `POST`
com capa/áudio válidos mas título vazio → o validador responde `400` depois de
os arquivos já estarem na pasta. A limpeza acontece no `errorHandler.js`
(`removeOrphanFiles`), que apaga `req.file`/`req.files` em toda requisição que
chega nele com erro.

**4. Botão de excluir dentro de `<a>` e modal dentro do card**
Um `<button>` ou outro `<a>` dentro de um `<a>` é HTML inválido, e o clique
"vaza" para o link: apertar Excluir também navegaria para o detalhe. Por isso o
card virou um `<article>` e só a capa/título são links. O modal não pode ficar
dentro do card porque o card tem `transform` no `:hover`, e um ancestral com
`transform` vira o referencial de `position: fixed` — o modal ficaria posicionado
em relação ao card, e não centralizado na tela. Ele fica fora da grade
(`Teleport to="body"`).

**5. Por que esconder "Editar" não é segurança**
O botão escondido só melhora a interface. Qualquer pessoa pode digitar a URL de
edição ou chamar a API direto (curl, DevTools) sem passar pela tela. Quem
realmente protege é a API: `GET /edit`, `PUT` e `DELETE` conferem o dono e
respondem `403` para quem não é — comportamento testado com a conta B.
