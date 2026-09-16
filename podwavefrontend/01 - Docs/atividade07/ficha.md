# Ficha de Preparação — Atividade Aula 07 (PodWave)

## 2. Antes de começar: qual é o padrão de arquivo do seu projeto?

Volte à Lista de Projetos e releia a funcionalidade "Upload de..." do seu
projeto sorteado. Ela cai em um de dois grupos:

- **Grupo A — dois arquivos (conteúdo + capa/imagem de destaque):** é o
  caso do próprio Shortz-App (`video` + `thumbnail`), e de projetos como um
  de vídeo de exercício com imagem de capa, ou de **áudio com capa do
  episódio**. Se o seu projeto tem um arquivo "principal" (vídeo, áudio) e
  faz sentido ter também uma imagem de destaque separada, você está aqui —
  siga o roteiro da Aula 07 quase à risca, só trocando os nomes.
- **Grupo B — um arquivo só:** é o caso de projetos cujo conteúdo principal
  já é uma imagem (ex.: uma foto, uma receita ilustrada por uma única
  imagem) — nesse caso, não existe uma "capa" separada do "conteúdo"; a
  imagem enviada é as duas coisas ao mesmo tempo. Se for o seu caso, adapte
  usando `multer.single(...)`, exatamente como você já fez na Aula 05
  (upload da foto de perfil) — só que hoje o arquivo pertence a uma
  entidade nova (não ao usuário), com sua própria tabela e sua própria rota.

> ⚠️ Se você não tem certeza de qual grupo é o seu, releia a frase exata da
> Lista de Projetos: se ela menciona um tipo de mídia só ("upload de novas
> receitas com imagens", por exemplo), é Grupo B. Se menciona um arquivo de
> conteúdo e algo que soa como identidade visual separada (uma "capa", uma
> "miniatura"), é Grupo A.

**Meu caso:** a funcionalidade sorteada para o PodWave é "Upload de
episódios em áudio (mp3) pelo criador do podcast". O conteúdo principal é
um arquivo de **áudio**, que não é, ele mesmo, uma imagem — então não é
Grupo B. Faz sentido o episódio ter também uma **capa** (imagem de
destaque, exibida nas listagens antes mesmo de o episódio ser reproduzido),
separada do áudio em si — é literalmente o exemplo "de áudio com capa do
episódio" citado acima como caso de **Grupo A**.

Recupere a sua ficha de preparação das atividades anteriores. Hoje ela
ganha as linhas abaixo:

| Dado | Seu valor |
|---|---|
| Nome do model da sua entidade principal (singular, PascalCase) | `Episode` |
| Nome da tabela (plural, snake_case) | `episodes` |
| Grupo (A ou B, conforme acima) | **A** |
| Nome do campo do arquivo principal | `audio` |
| Nome do campo da capa — só se Grupo A | `cover` |
| Nome da coluna de contagem no User que será incrementada hoje | `episodesCount` (a mesma nomeada na ficha da Aula 03) |

> 💡 O campo `description` / `DESCRIPTION_MAX` já era para existir em
> `config/constants.js` desde a Aula 05, reservado exatamente para hoje —
> mas neste projeto ele ainda não tinha sido criado. Como não existia,
> `DESCRIPTION_MAX: 500` foi adicionado agora, junto com `TITLE_MAX: 100`,
> em `podwaveapi/config/constants.js`, dentro de `VALIDATION` (nenhuma das
> duas constantes já existentes de outros campos foi reaproveitada).

### Onde cada nome aparece no código

- Model: `podwaveapi/modules/episode/episodeModel.js` (campos `title`,
  `description`, `audio`, `cover`, `userId`)
- Tabela: `episodes` (`tableName: 'episodes'`, criada por `sequelize.sync`)
- Associação: `podwaveapi/config/associations.js`
  (`User.hasMany(Episode)` / `Episode.belongsTo(User)`)
- Upload: `podwaveapi/middlewares/episodeMulter.js`
  (`multer.fields([{ name: 'audio' }, { name: 'cover' }])`)
- Contador: `User.episodesCount`, incrementado em
  `podwaveapi/modules/episode/episodeService.js` via
  `User.increment('episodesCount', ...)`

## Resposta ao checklist de alcançabilidade (Etapa 4)

A tela de envio (`/upload`, `UploadView.vue`) deixou de ser alcançável só
por URL digitada — o mesmo problema que a Aula 05 já tinha corrigido uma
vez neste projeto (na época, para a tela de perfil). Hoje ela está
acessível de duas formas, as duas conferidas na prática:

1. **Link visível na Navbar.** Em `TheNavbar.vue` existe
   `<router-link to="/upload">Publicar</router-link>`, dentro do bloco
   `v-if="isAuthenticated"` — ou seja, o link só aparece para quem já fez
   login, e desaparece para visitantes não autenticados (que veem
   "Criar Conta" / "Entrar" no lugar). Ao clicar no link a partir do Feed já
   logado, a URL muda para `/upload` sem a página recarregar — confirma
   que é navegação client-side do Vue Router (`createWebHistory`), não um
   link cru de `<a href>`.
2. **Proteção da rota em si.** Em `router/index.js`, a rota `/upload` tem
   `meta: { requiresAuth: true }`, e o guard global (`router.beforeEach`)
   redireciona para `/login` quem tenta acessá-la deslogado. Ou seja,
   mesmo que alguém digite `/upload` direto na barra de endereço sem estar
   logado, cai no login — a tela nunca fica "escondida, mas acessível" por
   quem não devia chegar lá.

Isso resolve os dois lados do problema: a tela é **descobrível**
(aparece um link de verdade na interface, não só por quem já conhece a
URL) e **protegida** (mesmo conhecendo a URL, só quem está autenticado
consegue de fato usá-la).