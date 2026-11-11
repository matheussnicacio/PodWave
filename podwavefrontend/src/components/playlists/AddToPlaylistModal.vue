<script setup>
import { reactive } from 'vue'
import BaseModal from '../base/BaseModal.vue'
import { useAsyncData } from '../../composables/useAsyncData'
import { runOptimistic } from '../../utils/optimistic'
import {
  getPlaylistsStatus,
  addEpisodeToPlaylist,
  removeEpisodeFromPlaylist,
} from '../../services/playlistService'

// Modal "Salvar": uma caixa de seleção por playlist, já marcada conforme o
// SERVIDOR (hasEpisode vem de GET /episodes/:id/playlists-status).
//
// Cada caixa é OTIMISTA (marcar é barato, reversível e quase sempre dá
// certo): muda na hora, e volta atrás se a API falhar (o toast vem do
// interceptor).
//
// :checked + @change, NUNCA v-model: v-model escreveria no estado no
// instante do clique, por conta própria, antes do nosso apply — e o rollback
// teria de brigar com ele. Com ligação só de ida, quem decide o que a caixa
// mostra é sempre `playlist.hasEpisode`.
const props = defineProps({
  episodeId: { type: [Number, String], required: true },
})

const emit = defineEmits(['close'])

const { data: playlists, error, isLoading, refresh } = useAsyncData(
  () => getPlaylistsStatus(props.episodeId),
  { initialData: [] }
)

// "Cerca" POR LINHA: ids das playlists com requisição em andamento. Um Set
// reativo (reactive(new Set())) — o Vue acompanha .has/.add/.delete.
// Dois cliques rápidos na mesma caixa = uma requisição; caixas diferentes
// continuam independentes.
const pending = reactive(new Set())

function toggle(playlist) {
  if (pending.has(playlist.id)) return
  pending.add(playlist.id)

  // Estado de ANTES, numa variável local: é ele (e não o valor já invertido
  // pelo apply) que decide se a requisição é adicionar ou remover.
  const hadEpisode = playlist.hasEpisode

  runOptimistic({
    apply: () => {
      const previousCount = playlist.episodesCount
      playlist.hasEpisode = !hadEpisode
      playlist.episodesCount = Math.max(previousCount + (hadEpisode ? -1 : 1), 0)
      return () => {
        playlist.hasEpisode = hadEpisode
        playlist.episodesCount = previousCount
      }
    },
    request: () => (hadEpisode
      ? removeEpisodeFromPlaylist(playlist.id, props.episodeId)
      : addEpisodeToPlaylist(playlist.id, props.episodeId)),
    // O servidor só precisa acertar o CONTADOR: hasEpisode já está certo
    // (a API respondeu sucesso para exatamente o que aplicamos).
    confirm: (data) => {
      playlist.episodesCount = data.episodesCount
    },
  }).finally(() => pending.delete(playlist.id))
}

function plural(count) {
  return count === 1 ? '1 episódio' : `${count} episódios`
}
</script>

<template>
  <BaseModal :open="true" title="Salvar em playlist" @close="emit('close')">
    <div v-if="isLoading" class="text-center py-3">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger mb-0" role="alert">
      {{ error }}
      <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="refresh">Tentar de novo</button>
    </div>

    <p v-else-if="playlists.length === 0" class="text-secondary mb-0">
      Você ainda não tem playlists.
      <router-link to="/my-playlists" @click="emit('close')">Crie a primeira</router-link>
      e volte aqui para salvar este episódio.
    </p>

    <ul v-else class="list-unstyled mb-0 playlist-checklist">
      <li v-for="playlist in playlists" :key="playlist.id" class="form-check">
        <input
          :id="`save-playlist-${playlist.id}`"
          class="form-check-input"
          type="checkbox"
          :checked="playlist.hasEpisode"
          :disabled="pending.has(playlist.id)"
          @change="toggle(playlist)"
        />
        <label class="form-check-label d-flex justify-content-between w-100" :for="`save-playlist-${playlist.id}`">
          <span>
            {{ playlist.title }}
            <i
              v-if="!playlist.isPublic"
              class="bi bi-lock-fill text-secondary ms-1"
              title="Privada"
              aria-label="Privada"
            ></i>
          </span>
          <span class="text-secondary small">{{ plural(playlist.episodesCount) }}</span>
        </label>
      </li>
    </ul>

    <template #footer>
      <button type="button" class="btn btn-outline-secondary" @click="emit('close')">Concluir</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.playlist-checklist .form-check {
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--pw-border);
}

.playlist-checklist .form-check:last-child {
  border-bottom: none;
}
</style>
