<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createEpisode } from '../services/episodeService'
import BaseInput from '../components/base/BaseInput.vue'
import BaseButton from '../components/base/BaseButton.vue'
import FormCard from '../components/base/FormCard.vue'

const TITLE_MAX = 100
const DESCRIPTION_MAX = 500

const router = useRouter()

const form = reactive({
  title: '',
  description: '',
})

const errors = reactive({
  title: '',
  description: '',
  audio: '',
  cover: '',
})

// Arquivos escolhidos nos <input type="file">, ainda não enviados.
const selectedAudio = ref(null)
const selectedCover = ref(null)

// URL local (via URL.createObjectURL) só para a prévia instantânea da
// capa — nunca dispara chamada de rede, é o próprio navegador lendo os
// bytes do arquivo que já estão na memória do <input>.
const coverPreviewUrl = ref('')

const apiErrorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

// onUploadProgress do Axios recebe um ProgressEvent com, entre outros
// campos, `loaded` (bytes já enviados) e `total` (tamanho total do corpo
// da requisição, quando o navegador consegue calculá-lo de antemão — o que
// é o caso aqui, já que os arquivos escolhidos têm tamanho conhecido antes
// do envio começar). uploadPercentage guarda só o resultado já convertido
// em 0-100, pronto para virar a largura da barra de progresso no template.
const uploadPercentage = ref(0)

function handleAudioChange(event) {
  const file = event.target.files[0]
  selectedAudio.value = file || null
}

function handleCoverChange(event) {
  const file = event.target.files[0]

  if (!file) {
    selectedCover.value = null
    if (coverPreviewUrl.value) {
      URL.revokeObjectURL(coverPreviewUrl.value)
      coverPreviewUrl.value = ''
    }
    return
  }

  selectedCover.value = file

  // Libera a URL de objeto anterior antes de criar uma nova, para não
  // vazar memória caso o usuário troque de capa várias vezes antes de enviar.
  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value)
  }
  coverPreviewUrl.value = URL.createObjectURL(file)
}

function validate() {
  errors.title = ''
  errors.description = ''
  errors.audio = ''
  errors.cover = ''

  if (!form.title.trim()) {
    errors.title = 'O título é obrigatório.'
  } else if (form.title.trim().length > TITLE_MAX) {
    errors.title = `O título deve ter no máximo ${TITLE_MAX} caracteres.`
  }

  if (form.description.length > DESCRIPTION_MAX) {
    errors.description = `A descrição deve ter no máximo ${DESCRIPTION_MAX} caracteres.`
  }

  if (!selectedAudio.value) {
    errors.audio = 'O arquivo de áudio (MP3) é obrigatório.'
  }

  if (!selectedCover.value) {
    errors.cover = 'A imagem de capa é obrigatória.'
  }

  return Object.values(errors).every((message) => message === '')
}

async function handleSubmit() {
  apiErrorMessage.value = ''
  successMessage.value = ''

  if (!validate()) {
    return
  }

  isSubmitting.value = true
  uploadPercentage.value = 0

  try {
    // FormData, não um objeto JSON: é o formato que o navegador sabe
    // serializar como multipart/form-data, incluindo os dois arquivos
    // brutos (áudio e capa) lado a lado com os campos de texto.
    const formData = new FormData()
    formData.append('title', form.title.trim())
    formData.append('description', form.description.trim())
    formData.append('audio', selectedAudio.value)
    formData.append('cover', selectedCover.value)

    const response = await createEpisode(formData, (progressEvent) => {
      if (!progressEvent.total) return
      uploadPercentage.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    })

    successMessage.value = response.message || 'Episódio publicado com sucesso!'

    // Limpa o formulário: o próximo episódio começa do zero, em vez de
    // manter título/descrição/arquivos de um envio que já terminou.
    form.title = ''
    form.description = ''
    selectedAudio.value = null
    selectedCover.value = null
    if (coverPreviewUrl.value) {
      URL.revokeObjectURL(coverPreviewUrl.value)
      coverPreviewUrl.value = ''
    }

    setTimeout(() => router.push({ name: 'my-podcasts' }), 1500)
  } catch (error) {
    apiErrorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <FormCard title="Publicar Episódio" subtitle="Compartilhe um novo episódio com seus ouvintes" icon="bi-upload" width="md">
    <form novalidate @submit.prevent="handleSubmit">
      <BaseInput
        id="title"
        v-model="form.title"
        label="Título"
        :error="errors.title"
        :maxlength="TITLE_MAX"
        required
      />

      <BaseInput
        id="description"
        v-model="form.description"
        label="Descrição"
        as="textarea"
        :rows="3"
        :maxlength="DESCRIPTION_MAX"
        :error="errors.description"
        :help-text="`${form.description.length}/${DESCRIPTION_MAX} caracteres`"
      />

      <div class="mb-3">
        <label for="audio" class="form-label">Arquivo de áudio (MP3)</label>
        <input
          id="audio"
          type="file"
          class="form-control"
          :class="{ 'is-invalid': errors.audio }"
          accept="audio/mpeg,audio/mp3"
          @change="handleAudioChange"
        />
        <div v-if="errors.audio" class="invalid-feedback">{{ errors.audio }}</div>
        <div v-else class="form-text">Somente MP3, até 50MB.</div>
        <div v-if="selectedAudio" class="form-text">Selecionado: {{ selectedAudio.name }}</div>
      </div>

      <div class="mb-3">
        <label for="cover" class="form-label">Imagem de capa</label>
        <div class="d-flex align-items-start gap-3">
          <img v-if="coverPreviewUrl" :src="coverPreviewUrl" alt="Prévia da capa" class="thumbnail-preview" />
          <div class="flex-grow-1">
            <input
              id="cover"
              type="file"
              class="form-control"
              :class="{ 'is-invalid': errors.cover }"
              accept="image/png,image/jpeg,image/webp"
              @change="handleCoverChange"
            />
            <div v-if="errors.cover" class="invalid-feedback d-block">{{ errors.cover }}</div>
            <div v-else class="form-text">JPEG, PNG ou WEBP, até 50MB.</div>
          </div>
        </div>
      </div>

      <div v-if="isSubmitting" class="mb-3">
        <div class="progress" role="progressbar" :aria-valuenow="uploadPercentage" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-bar" :style="{ width: uploadPercentage + '%' }">{{ uploadPercentage }}%</div>
        </div>
      </div>

      <div v-if="apiErrorMessage" class="alert alert-danger py-2" role="alert">
        {{ apiErrorMessage }}
      </div>
      <div v-if="successMessage" class="alert alert-success py-2" role="alert">
        {{ successMessage }}
      </div>

      <BaseButton type="submit" :loading="isSubmitting">
        Publicar episódio
        <template #loading>Enviando...</template>
      </BaseButton>
    </form>
  </FormCard>
</template>
