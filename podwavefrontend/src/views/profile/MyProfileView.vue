<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getMyProfile, updateProfile } from '../../services/authService'
import { getProfilePictureUrl } from '../../utils/media'
import { useAuthStore } from '../../stores/auth'

const BIO_MAX = 255

const authStore = useAuthStore()

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

    authStore.updateUser({ ...authStore.user, ...updatedProfile })
    successMessage.value = response.message || 'Perfil atualizado com sucesso.'
  } catch (error) {
    apiErrorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-6">
        <h1 class="h3 mb-4">Meu Perfil</h1>

        <p v-if="isLoading" class="text-secondary">Carregando...</p>

        <div v-else-if="loadErrorMessage" class="alert alert-danger">{{ loadErrorMessage }}</div>

        <div v-else class="card podwave-auth-card shadow-sm">
          <div class="card-body p-4">
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

              <div class="mb-3">
                <label for="fullName" class="form-label">Nome completo</label>
                <input
                  id="fullName"
                  v-model="form.fullName"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': errors.fullName }"
                />
                <div v-if="errors.fullName" class="invalid-feedback">{{ errors.fullName }}</div>
              </div>

              <div class="mb-3">
                <label for="bio" class="form-label">Bio</label>
                <textarea
                  id="bio"
                  v-model="form.bio"
                  class="form-control"
                  :class="{ 'is-invalid': errors.bio }"
                  rows="3"
                  :maxlength="BIO_MAX"
                ></textarea>
                <div v-if="errors.bio" class="invalid-feedback">{{ errors.bio }}</div>
                <div class="form-text">{{ form.bio.length }}/{{ BIO_MAX }} caracteres</div>
              </div>

              <div v-if="apiErrorMessage" class="alert alert-danger py-2" role="alert">
                {{ apiErrorMessage }}
              </div>
              <div v-if="successMessage" class="alert alert-success py-2" role="alert">
                {{ successMessage }}
              </div>

              <button type="submit" class="btn btn-primary w-100" :disabled="isSubmitting">
                {{ isSubmitting ? 'Salvando...' : 'Salvar alterações' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
