<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../../services/authService'

const router = useRouter()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
})

const isSubmitting = ref(false)
const apiErrorMessage = ref('')

function validate() {
  Object.keys(errors).forEach((key) => (errors[key] = ''))

  if (!form.fullName.trim()) {
    errors.fullName = 'O nome completo é obrigatório.'
  }

  if (form.username.trim().length < 3 || form.username.trim().length > 20) {
    errors.username = 'O nome de usuário deve ter entre 3 e 20 caracteres.'
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(form.email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (form.password.length < 6) {
    errors.password = 'A senha deve ter pelo menos 6 caracteres.'
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'As senhas não coincidem.'
  }

  return Object.values(errors).every((message) => message === '')
}

async function handleSubmit() {
  apiErrorMessage.value = ''

  if (!validate()) {
    return
  }

  isSubmitting.value = true

  try {
    const response = await register({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      fullName: form.fullName.trim(),
    })

    console.log('Conta criada:', response.data)
    router.push({ name: 'login' })
  } catch (error) {
    apiErrorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <h1>Criar Conta</h1>

    <form @submit.prevent="handleSubmit">
      <div class="field">
        <label for="fullName">Nome completo</label>
        <input id="fullName" type="text" v-model="form.fullName" />
        <span v-if="errors.fullName" class="error-message">{{ errors.fullName }}</span>
      </div>

      <div class="field">
        <label for="username">Usuário</label>
        <input id="username" type="text" v-model="form.username" />
        <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
      </div>

      <div class="field">
        <label for="email">E-mail</label>
        <input id="email" type="email" v-model="form.email" />
        <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
      </div>

      <div class="field">
        <label for="password">Senha</label>
        <input id="password" type="password" v-model="form.password" />
        <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
      </div>

      <div class="field">
        <label for="confirmPassword">Confirmar senha</label>
        <input id="confirmPassword" type="password" v-model="form.confirmPassword" />
        <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
      </div>

      <p v-if="apiErrorMessage" class="api-error">{{ apiErrorMessage }}</p>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Criando conta...' : 'Criar Minha Conta' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.auth-page {
  max-width: 420px;
  margin: 2rem auto;
  padding: 1.5rem;
}

.auth-page h1 {
  margin-bottom: 1.5rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

label {
  font-size: 0.9rem;
  opacity: 0.8;
}

input {
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #26262e;
  background-color: #16161c;
  color: #f2f2f2;
  font-size: 1rem;
}

input:focus {
  outline: 2px solid #6c5ce7;
  outline-offset: 1px;
}

.error-message {
  color: #ff6b6b;
  font-size: 0.8rem;
}

.api-error {
  color: #ff6b6b;
  font-size: 0.9rem;
}

button {
  padding: 0.7rem;
  border: none;
  border-radius: 6px;
  background-color: #6c5ce7;
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
