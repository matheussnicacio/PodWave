<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { createComment, getComments } from '../../services/commentService'
import { getProfilePictureUrl } from '../../utils/media'
import { formatDateTime } from '../../utils/format'
import BaseButton from '../base/BaseButton.vue'

// Mesmo limite da API (VALIDATION.COMMENT_MAX). A validação do front é só
// conforto: poupa uma requisição inútil. Quem realmente garante é a API.
const COMMENT_MAX = 500

const props = defineProps({
  episodeId: { type: [Number, String], required: true },
})

// 'created' avisa o Detalhe para subir o contador de comentários na tela.
const emit = defineEmits(['created'])

const route = useRoute()
const { isAuthenticated } = useAuth()

const comments = ref([])
const isLoading = ref(true)
const loadError = ref('')

const content = ref('')
const isSubmitting = ref(false)
const formError = ref('')

const remaining = computed(() => COMMENT_MAX - content.value.length)

// Descarta respostas atrasadas se o :id mudar enquanto a lista carrega.
let latestRequest = 0

async function loadComments(episodeId) {
  const requestId = ++latestRequest
  isLoading.value = true
  loadError.value = ''
  comments.value = []

  try {
    const response = await getComments(episodeId)
    if (requestId !== latestRequest) return
    comments.value = response.data
  } catch (err) {
    if (requestId !== latestRequest) return
    loadError.value = err.message || 'Não foi possível carregar os comentários.'
  } finally {
    if (requestId === latestRequest) isLoading.value = false
  }
}

watch(() => props.episodeId, loadComments, { immediate: true })

async function submit() {
  if (isSubmitting.value) return
  formError.value = ''

  // .trim() ANTES de checar vazio, como no back-end: "   " não é comentário.
  const text = content.value.trim()
  if (!text) {
    formError.value = 'Escreva um comentário antes de enviar.'
    return
  }
  if (text.length > COMMENT_MAX) {
    formError.value = `O comentário deve ter no máximo ${COMMENT_MAX} caracteres.`
    return
  }

  isSubmitting.value = true
  try {
    const response = await createComment(props.episodeId, text)
    // O comentário novo entra no TOPO da lista local (unshift), sem
    // recarregar tudo — a API já devolve o autor junto.
    comments.value.unshift(response.data)
    content.value = ''
    emit('created', response.data)
  } catch (err) {
    formError.value = err.message || 'Não foi possível publicar o comentário.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="comment-section" aria-labelledby="comments-title">
    <h2 id="comments-title" class="h5 mb-3">Comentários</h2>

    <form v-if="isAuthenticated" class="comment-form mb-4" novalidate @submit.prevent="submit">
      <label for="comment-content" class="visually-hidden">Escreva um comentário</label>
      <textarea
        id="comment-content"
        v-model="content"
        class="form-control"
        rows="3"
        placeholder="Escreva um comentário..."
        :disabled="isSubmitting"
      ></textarea>

      <div class="d-flex justify-content-between align-items-center mt-2 gap-3">
        <small :class="remaining < 0 ? 'text-danger' : 'text-secondary'">
          {{ remaining }} caracteres restantes
        </small>
        <BaseButton type="submit" :block="false" :loading="isSubmitting">
          Comentar
          <template #loading>Enviando...</template>
        </BaseButton>
      </div>

      <div v-if="formError" class="alert alert-danger py-2 mt-2 mb-0" role="alert">{{ formError }}</div>
    </form>

    <p v-else class="text-secondary mb-4">
      <router-link :to="{ name: 'login', query: { redirect: route.fullPath } }">Entre</router-link>
      para comentar.
    </p>

    <div v-if="isLoading" class="text-center py-3">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Carregando comentários...</span>
      </div>
    </div>

    <div v-else-if="loadError" class="alert alert-danger" role="alert">
      {{ loadError }}
      <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="loadComments(episodeId)">
        Tentar de novo
      </button>
    </div>

    <p v-else-if="comments.length === 0" class="text-secondary">
      Nenhum comentário ainda. Seja a primeira pessoa a comentar!
    </p>

    <ul v-else class="comment-list list-unstyled mb-0">
      <li v-for="comment in comments" :key="comment.id" class="comment-item">
        <img
          :src="getProfilePictureUrl(comment.author?.profilePicture)"
          alt=""
          width="36"
          height="36"
          class="rounded-circle flex-shrink-0"
        />
        <div class="comment-body">
          <div class="comment-header">
            <router-link
              v-if="comment.author"
              :to="{ name: 'public-profile', params: { username: comment.author.username } }"
              class="comment-author"
            >{{ comment.author.fullName || comment.author.username }}</router-link>
            <span v-else class="comment-author">Autor desconhecido</span>
            <small class="text-secondary ms-2">{{ formatDateTime(comment.createdAt) }}</small>
          </div>
          <!-- Texto SEMPRE com {{ }}: o Vue escapa HTML e <b>, <img onerror=...>
               aparecem como texto. v-html interpretaria o que a pessoa
               digitou como HTML de verdade (XSS: script rodando no navegador
               de quem abre a página). As quebras de linha ficam preservadas
               só por CSS (white-space: pre-wrap), sem tocar no HTML. -->
          <p class="comment-text">{{ comment.content }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
