<script setup>
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getEpisodeForEdit, updateEpisode } from '../../services/episodeService'
import { getEpisodeCoverUrl } from '../../utils/media'
import BaseInput from '../../components/base/BaseInput.vue'
import BaseButton from '../../components/base/BaseButton.vue'
import FormCard from '../../components/base/FormCard.vue'

const TITLE_MAX = 100
const DESCRIPTION_MAX = 500

const route = useRoute()

const isLoading = ref(true)
const loadErrorMessage = ref('')

const form = reactive({ title: '', description: '' })
const errors = reactive({ title: '', description: '' })

// Capa já salva no servidor; a capa nova (opcional) fica só no navegador até o envio.
const savedCover = ref('')
const selectedCover = ref(null)
const coverPreviewUrl = ref('')

const apiErrorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

function clearPreview() {
  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value)
    coverPreviewUrl.value = ''
  }
}

async function loadEpisode(id) {
  isLoading.value = true
  loadErrorMessage.value = ''
  try {
    const response = await getEpisodeForEdit(id)
    const episode = response.data
    form.title = episode.title || ''
    form.description = episode.description || ''
    savedCover.value = episode.cover || ''
  } catch (err) {
    // 403 (não é seu), 404 (não existe) etc.: mostra a mensagem da API em vez
    // de deixar a tela quebrada/em branco.
    loadErrorMessage.value = err.message || 'Não foi possível carregar o episódio.'
  } finally {
    isLoading.value = false
  }
}

watch(() => route.params.id, (id) => loadEpisode(id), { immediate: true })

function handleCoverChange(event) {
  const file = event.target.files[0]
  clearPreview()

  if (!file) {
    selectedCover.value = null
    return
  }

  selectedCover.value = file
  // Prévia local, instantânea, sem nenhuma chamada de rede.
  coverPreviewUrl.value = URL.createObjectURL(file)
}

function validate() {
  errors.title = ''
  errors.description = ''

  if (!form.title.trim()) {
    errors.title = 'O título é obrigatório.'
  } else if (form.title.trim().length > TITLE_MAX) {
    errors.title = `O título deve ter no máximo ${TITLE_MAX} caracteres.`
  }

  if (form.description.length > DESCRIPTION_MAX) {
    errors.description = `A descrição deve ter no máximo ${DESCRIPTION_MAX} caracteres.`
  }

  return !errors.title && !errors.description
}

async function handleSubmit() {
  apiErrorMessage.value = ''
  successMessage.value = ''

  // Falhou aqui = nenhuma requisição sai (nada a limpar no servidor).
  if (!validate()) return

  isSubmitting.value = true

  try {
    const formData = new FormData()
    formData.append('title', form.title.trim())
    formData.append('description', form.description.trim())
    // A capa só entra se a pessoa escolheu uma nova; sem ela a API mantém a atual.
    if (selectedCover.value) {
      formData.append('cover', selectedCover.value)
    }

    const response = await updateEpisode(route.params.id, formData)

    savedCover.value = response.data.cover
    selectedCover.value = null
    clearPreview()
    successMessage.value = response.message || 'Episódio atualizado com sucesso.'
  } catch (err) {
    apiErrorMessage.value = err.message
  } finally {
    isSubmitting.value = false
  }
}

onBeforeUnmount(clearPreview)
</script>

<template>
  <div v-if="isLoading" class="container py-5 text-center text-secondary">Carregando...</div>

  <div v-else-if="loadErrorMessage" class="container py-5">
    <div class="alert alert-danger" role="alert">
      {{ loadErrorMessage }}
      <router-link to="/my-podcasts" class="alert-link ms-2">Voltar para Meus Podcasts</router-link>
    </div>
  </div>

  <FormCard v-else title="Editar Episódio" icon="bi-pencil-square" width="md">
    <form novalidate @submit.prevent="handleSubmit">
      <BaseInput id="title" v-model="form.title" label="Título" :error="errors.title" :maxlength="TITLE_MAX" required />

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
        <label for="cover" class="form-label">Capa</label>
        <div class="d-flex align-items-start gap-3">
          <img
            :src="coverPreviewUrl || getEpisodeCoverUrl(savedCover)"
            alt="Capa do episódio"
            class="thumbnail-preview"
          />
          <div class="flex-grow-1">
            <input
              id="cover"
              type="file"
              class="form-control"
              accept="image/png,image/jpeg,image/webp"
              @change="handleCoverChange"
            />
            <div class="form-text">
              JPEG, PNG ou WEBP. Deixe em branco para manter a capa atual. O áudio não pode ser
              trocado: para isso, exclua o episódio e publique de novo.
            </div>
          </div>
        </div>
      </div>

      <div v-if="apiErrorMessage" class="alert alert-danger py-2" role="alert">{{ apiErrorMessage }}</div>
      <div v-if="successMessage" class="alert alert-success py-2" role="alert">
        {{ successMessage }}
        <router-link to="/my-podcasts" class="alert-link ms-2">Voltar para Meus Podcasts</router-link>
      </div>

      <BaseButton type="submit" :loading="isSubmitting">
        Salvar alterações
        <template #loading>Salvando...</template>
      </BaseButton>
    </form>
  </FormCard>
</template>
