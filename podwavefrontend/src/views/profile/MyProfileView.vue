<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getMyProfile, updateProfile } from '../../services/authService'
import { getProfilePictureUrl } from '../../utils/media'
import { useAuth } from '../../composables/useAuth'
import BaseInput from '../../components/base/BaseInput.vue'
import BaseButton from '../../components/base/BaseButton.vue'
import FormCard from '../../components/base/FormCard.vue'

const BIO_MAX = 255

const { updateUser } = useAuth()

const isLoading = ref(true)
const loadErrorMessage = ref('')

const form = reactive({
  fullName: '',
  bio: '',
})

const errors = reactive({
  fullName: '',
  bio: '',
})

// Nome do arquivo já salvo no servidor (vem do GET /profile/me). Usado para
// montar a URL da foto atual enquanto nenhuma foto nova foi escolhida.
const savedProfilePicture = ref('')

// Arquivo escolhido no <input type="file">, ainda não enviado.
const selectedFile = ref(null)

// URL local (via URL.createObjectURL), só para a prévia instantânea.
// Nunca dispara nenhuma chamada de rede: é o próprio navegador lendo os
// bytes do arquivo que já estão na memória do <input>.
const previewUrl = ref('')

const apiErrorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

function currentPictureUrl() {
  return previewUrl.value || getProfilePictureUrl(savedProfilePicture.value)
}

async function loadProfile() {
  isLoading.value = true
  loadErrorMessage.value = ''

  try {
    const response = await getMyProfile()
    const profile = response.data

    form.fullName = profile.fullName || ''
    form.bio = profile.bio || ''
    savedProfilePicture.value = profile.profilePicture || ''
  } catch (error) {
    loadErrorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}

onMounted(loadProfile)

function handleFileChange(event) {
  const file = event.target.files[0]

  if (!file) {
    selectedFile.value = null
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = ''
    }
    return
  }

  selectedFile.value = file

  // Libera a URL de objeto anterior antes de criar uma nova, para não
  // vazar memória caso o usuário troque de foto várias vezes antes de salvar.
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
}

function validate() {
  errors.fullName = ''
  errors.bio = ''

  if (!form.fullName.trim()) {
    errors.fullName = 'O nome completo é obrigatório.'
  }

  if (form.bio.length > BIO_MAX) {
    errors.bio = `A bio deve ter no máximo ${BIO_MAX} caracteres.`
  }

  return !errors.fullName && !errors.bio
}

async function handleSubmit() {
  apiErrorMessage.value = ''
  successMessage.value = ''

  if (!validate()) {
    return
  }

  isSubmitting.value = true

  try {
    // FormData, não um objeto JSON: é o formato que o navegador sabe
    // serializar como multipart/form-data, incluindo o arquivo bruto.
    const formData = new FormData()
    formData.append('fullName', form.fullName.trim())
    formData.append('bio', form.bio.trim())

    if (selectedFile.value) {
      formData.append('profilePicture', selectedFile.value)
    }

    const response = await updateProfile(formData)
    const updatedProfile = response.data

    form.fullName = updatedProfile.fullName || ''
    form.bio = updatedProfile.bio || ''
    savedProfilePicture.value = updatedProfile.profilePicture || ''

    // Limpa a seleção local: a foto "nova" agora é a foto salva de verdade,
    // então a prévia local deixa de fazer sentido.
    selectedFile.value = null
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = ''
    }

    updateUser(updatedProfile)
    successMessage.value = response.message || 'Perfil atualizado com sucesso.'
  } catch (error) {
    apiErrorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isLoading" class="container py-5 text-center text-secondary">Carregando...</div>

  <div v-else-if="loadErrorMessage" class="container py-5">
    <div class="alert alert-danger">{{ loadErrorMessage }}</div>
  </div>

  <FormCard v-else title="Meu Perfil" icon="bi-person-circle" width="md">
    <form novalidate @submit.prevent="handleSubmit">
      <div class="d-flex flex-column align-items-center mb-4">
        <img
          :src="currentPictureUrl()"
          alt="Foto de perfil"
          class="rounded-circle mb-3"
          width="120"
          height="120"
          style="object-fit: cover"
        />

        <label for="profilePicture" class="form-label">Foto de perfil</label>
        <input
          id="profilePicture"
          type="file"
          class="form-control"
          accept="image/png, image/jpeg, image/webp"
          @change="handleFileChange"
        />
        <div class="form-text">JPEG, PNG ou WEBP, até 5MB. Deixe em branco para manter a foto atual.</div>
      </div>

      <BaseInput id="fullName" v-model="form.fullName" label="Nome completo" :error="errors.fullName" required />

      <BaseInput
        id="bio"
        v-model="form.bio"
        label="Bio"
        as="textarea"
        :rows="3"
        :maxlength="BIO_MAX"
        :error="errors.bio"
        :help-text="`${form.bio.length}/${BIO_MAX} caracteres`"
      />

      <div v-if="apiErrorMessage" class="alert alert-danger py-2" role="alert">
        {{ apiErrorMessage }}
      </div>
      <div v-if="successMessage" class="alert alert-success py-2" role="alert">
        {{ successMessage }}
      </div>

      <BaseButton type="submit" :loading="isSubmitting">
        Salvar alterações
        <template #loading>Salvando...</template>
      </BaseButton>
    </form>
  </FormCard>
</template>
