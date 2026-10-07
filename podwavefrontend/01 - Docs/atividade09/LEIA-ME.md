# Atividade Aula 09 — PodWave (CRUD do Episódio, Perfil Público e Órfãos)

Entidade: **Episode** · **Grupo A** (áudio + capa). Na edição só a capa pode
ser trocada; na exclusão os dois arquivos são apagados.

## Backend (`podwaveapi/`)
| Item | Arquivo |
|---|---|
| `GET /api/my-episodes` | `episodeRoutes.js` / `episodeController.js` / `episodeService.js` |
| `GET /api/episodes/:id/edit` (404 → 403) | idem |
| `PUT /api/episodes/:id` (`isAuthenticated` → `multer.single('cover')` → validador) | idem + `episodeValidator.js` |
| `DELETE /api/episodes/:id` (banco → disco, decrementa `episodesCount`) | idem |
| `GET /api/profile/:username` com `optionalAuth`, `include` + `order`, `isOwner` | `userRoutes.js` / `userService.js` |
| Limpeza de órfãos | `middlewares/errorHandler.js` |
| `login` passa a devolver `profilePicture` (avatar do menu) | `userService.js` |

## Frontend (`podwavefrontend/`)
| Item | Arquivo |
|---|---|
| `useClickOutside` | `src/composables/useClickOutside.js` |
| `BaseModal` (genérico, `Teleport`) | `src/components/base/BaseModal.vue` |
| Menu do avatar | `src/components/layout/TheNavbar.vue` |
| Card refatorado (autor opcional + slot `actions`) | `src/components/episodes/EpisodeCard.vue` |
| Perfil Público (`/profile/:username`) | `src/views/profile/PublicProfileView.vue` |
| Meus Podcasts (editar + excluir com modal) | `src/views/podcasts/MyPodcastsView.vue` |
| Editar Episódio | `src/views/podcasts/EditPodcastView.vue` |
| Serviços novos | `episodeService.js`, `authService.js` |

## Testes (Parte A)
```bash
cd podwaveapi
EMAIL_A=... SENHA_A=... EMAIL_B=... SENHA_B=... \
AUDIO=./exemplo.mp3 CAPA1=./capa1.png CAPA2=./capa2.png \
bash "../podwavefrontend/01 - Docs/atividade09/testes-curl-atividade09.sh"
```
Tire um print de cada bloco numerado (inclui a contagem de arquivos antes/depois).
