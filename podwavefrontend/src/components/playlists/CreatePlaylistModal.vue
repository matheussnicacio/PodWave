<script setup>
import { reactive, ref, watch } from 'vue'
import BaseModal from '../base/BaseModal.vue'
import BaseInput from '../base/BaseInput.vue'
import BaseButton from '../base/BaseButton.vue'
import { createPlaylist } from '../../services/playlistService'
import { LIMITS } from '../../config/constants'

// Modal de criação de playlist. É um FORMULÁRIO: o erro (de validação ou da
// API) aparece aqui dentro, junto dos campos — nunca em toast. Por isso o
// service chama a API com { silent: true }.
//
// O botão "Criar" fica no rodapé do BaseModal, FORA do <form>. O atributo
// form="create-playlist-form" liga o botão ao formulário mesmo assim: Enter
// num campo e clique no botão disparam o MESMO @submit.
//
// novalidate: quem valida é validate() (mensagens em português, iguais às
// da API), não o balão nativo do navegador.
const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'created'])

const FORM_ID = 'create-playlist-form'

const form = reactive({ title: '', description: '', isPublic: false })
const errors = reactive({ title: '', description: '' })
const apiError = ref('')
const isSubmitting = ref(false)

// Toda vez que o modal ABRE, começa limpo (isPublic sempre false: privada
// por padrão, como na API).
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    form.title = ''
    form.description = ''
    form.isPublic = false
    errors.title = ''
    errors.description = ''
    apiError.value = ''
  }
)

// Valida o texto SEM os espaços das pontas — a API faz o mesmo (.trim()):
// "  ab  " tem 2 letras de verdade, não 6.
function validate() {
  const title = form.title.trim()
  const description = form.description.trim()
  errors.title = ''
  errors.description = ''

  if (!title) {
    errors.title = 'O título da playlist é obrigatório.'
  } else if (title.length < LIMITS.PLAYLIST_TITLE_MIN || title.length > LIMITS.PLAYLIST_TITLE_MAX) {
    errors.title = `O título deve ter entre ${LIMITS.PLAYLIST_TITLE_MIN} e ${LIMITS.PLAYLIST_TITLE_MAX} caracteres.`
  }
  if (description.length > LIMITS.PLAYLIST_DESCRIPTION_MAX) {
    errors.description = `A descrição deve ter no máximo ${LIMITS.PLAYLIST_DESCRIPTION_MAX} caracteres.`
  }
  return !errors.title && !errors.description
}

async function onSubmit() {
  if (isSubmitting.value) return
  apiError.value = ''
  if (!validate()) return // inválido: nenhuma requisição sai

  isSubmitting.value = true
  try {
    const response = await createPlaylist({
      title: form.title.trim(),
      description: form.description.trim(),
      isPublic: form.isPublic,
    })
    // Emite o que a API DEVOLVEU (id, datas, contador), não o formulário.
    emit('created', response.data)
  } catch (err) {
    apiError.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <BaseModal :open="open" title="Nova playlist" :busy="isSubmitting" @close="emit('close')">
    <form :id="FORM_ID" novalidate @submit.prevent="onSubmit">
      <div v-if="apiError" class="alert alert-danger py-2" role="alert">{{ apiError }}</div>

      <BaseInput
        id="playlist-title"
        v-model="form.title"
        label="Título"
        :error="errors.title"
        :maxlength="LIMITS.PLAYLIST_TITLE_MAX"
        required
      />

      <BaseInput
        id="playlist-description"
        v-model="form.description"
        label="Descrição (opcional)"
        as="textarea"
        :rows="3"
        :error="errors.description"
        :maxlength="LIMITS.PLAYLIST_DESCRIPTION_MAX"
      />

      <div class="form-check">
        <input id="playlist-public" v-model="form.isPublic" class="form-check-input" type="checkbox" />
        <label class="form-check-label" for="playlist-public">Pública</label>
        <div class="form-text">Playlists privadas só aparecem para você.</div>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="outline-secondary" :block="false" :disabled="isSubmitting" @click="emit('close')">
        Cancelar
      </BaseButton>
      <BaseButton type="submit" :form="FORM_ID" :block="false" :loading="isSubmitting">
        Criar playlist
        <template #loading>Criando...</template>
      </BaseButton>
    </template>
  </BaseModal>
</template>
