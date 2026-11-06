<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { search } from '../services/searchService'
import { useAsyncData } from '../composables/useAsyncData'
import { useDebouncedValue } from '../composables/useDebouncedValue'
import { SEARCH } from '../config/constants'
import { getProfilePictureUrl } from '../utils/media'
import EpisodeCard from '../components/episodes/EpisodeCard.vue'

const route = useRoute()
const router = useRouter()

// O termo na URL (?q=) é a fonte que sobrevive ao F5 e a um link
// compartilhado. Pode chegar como array (?q=a&q=b): só texto conta.
function readQueryTerm() {
  return typeof route.query.q === 'string' ? route.query.q : ''
}

// Três valores, três papéis:
//  - typedText:      o que o campo MOSTRA (muda a cada tecla);
//  - term:           o mesmo texto, mas só depois de uma PAUSA (debounce);
//  - normalizedTerm: term sem espaços nas pontas — é ele que dispara a busca
//                    e vai para a URL.
const typedText = ref(readQueryTerm())
const term = useDebouncedValue(typedText, SEARCH.DEBOUNCE_MS)
const normalizedTerm = computed(() => term.value.trim())
const isTermTooShort = computed(() => normalizedTerm.value.length < SEARCH.MIN_LENGTH)

// Termo curto: nem chama a API — devolve a "resposta vazia" já pronta, no
// mesmo formato do envelope da API (por isso Promise.resolve({ data })).
//
// DUAS DEFESAS diferentes protegem esta busca:
//  - o debounce (acima) reduz QUANTAS requisições saem: uma por pausa;
//  - o lastCallId (dentro do useAsyncData) garante que só a resposta da
//    ÚLTIMA requisição é exibida, mesmo que uma antiga chegue depois.
const { data: results, error, isLoading, refresh } = useAsyncData(
  () => (isTermTooShort.value
    ? Promise.resolve({ data: { query: normalizedTerm.value, podcasts: [], users: [] } })
    : search(normalizedTerm.value)),
  { watch: normalizedTerm }
)

const people = computed(() => results.value?.users ?? [])
const episodes = computed(() => results.value?.podcasts ?? [])
const hasResults = computed(() => people.value.length > 0 || episodes.value.length > 0)

// URL -> campo: quando a URL muda por fora (Navbar com outro termo, Voltar),
// o campo acompanha. Só altera se for diferente do termo atual — senão a
// escrita da URL (abaixo) voltaria aqui e mexeria no campo enquanto a pessoa
// digita.
watch(
  () => route.query.q,
  () => {
    const fromUrl = readQueryTerm()
    if (fromUrl.trim() !== normalizedTerm.value) {
      typedText.value = fromUrl
    }
  }
)

// Campo -> URL, com router.REPLACE (não push): cada pausa na digitação não
// vira uma entrada nova no histórico. "Voltar" sai da busca, em vez de
// passar por "p", "po", "pod"...
watch(normalizedTerm, (value) => {
  if (readQueryTerm().trim() === value) return
  router.replace({ name: 'search', query: value ? { q: value } : {} })
})

// Foco no campo dado por CÓDIGO (ref + onMounted), e não pelo atributo
// autofocus: o autofocus só funciona no carregamento da página inteira, não
// quando o Vue Router troca de tela.
const inputRef = ref(null)
onMounted(() => inputRef.value?.focus())

function plural(count, one, many) {
  return count === 1 ? `1 ${one}` : `${count} ${many}`
}
</script>

<template>
  <div class="p-4">
    <h1 class="h3 mb-3">Explorar</h1>

    <div class="input-group mb-2 search-field">
      <span class="input-group-text"><i class="bi bi-search"></i></span>
      <input
        ref="inputRef"
        v-model="typedText"
        type="search"
        class="form-control"
        placeholder="Buscar episódios e pessoas"
        aria-label="Buscar episódios e pessoas"
        maxlength="100"
      />
    </div>

    <p v-if="isTermTooShort" class="text-secondary small">
      Digite pelo menos {{ SEARCH.MIN_LENGTH }} letras para buscar episódios pelo título e pessoas pelo nome ou usuário.
    </p>

    <div v-else-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Buscando...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
      <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="refresh">Tentar de novo</button>
    </div>

    <p v-else-if="results && !hasResults" class="text-secondary">
      Nada encontrado para "{{ results.query }}". Tente outra palavra do título ou outro nome.
    </p>

    <template v-else-if="results">
      <section v-if="people.length > 0" class="mb-4">
        <h2 class="h5 mb-2">Pessoas <span class="text-secondary small">({{ plural(people.length, 'resultado', 'resultados') }})</span></h2>
        <ul class="follow-list">
          <li v-for="person in people" :key="person.id" class="follow-list-item">
            <router-link :to="{ name: 'public-profile', params: { username: person.username } }">
              <img
                :src="getProfilePictureUrl(person.profilePicture)"
                :alt="`Foto de ${person.username}`"
                class="follow-list-avatar"
                loading="lazy"
              />
            </router-link>
            <div class="follow-list-body">
              <router-link
                :to="{ name: 'public-profile', params: { username: person.username } }"
                class="fw-semibold text-decoration-none"
              >{{ person.fullName || person.username }}</router-link>
              <div class="text-secondary small">@{{ person.username }}</div>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="episodes.length > 0">
        <h2 class="h5 mb-2">Episódios <span class="text-secondary small">({{ plural(episodes.length, 'resultado', 'resultados') }})</span></h2>
        <div class="episode-grid">
          <EpisodeCard v-for="episode in episodes" :key="episode.id" :episode="episode" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.search-field {
  max-width: 560px;
}
</style>
