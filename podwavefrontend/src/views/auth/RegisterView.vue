<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../../services/authService'
import BaseInput from '../../components/base/BaseInput.vue'
import BaseButton from '../../components/base/BaseButton.vue'
import FormCard from '../../components/base/FormCard.vue'

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
  <FormCard title="Criar Conta" subtitle="Junte-se ao PodWave" icon="bi-person-plus">
    <form novalidate @submit.prevent="handleSubmit">
      <BaseInput
        id="fullName"
        v-model="form.fullName"
        label="Nome completo"
        :error="errors.fullName"
        autocomplete="name"
        required
      />

      <BaseInput
        id="username"
        v-model="form.username"
        label="Usuário"
        :error="errors.username"
        autocomplete="username"
        required
      />

      <BaseInput
        id="email"
        v-model="form.email"
        label="E-mail"
        type="email"
        :error="errors.email"
        autocomplete="email"
        required
      />

      <BaseInput
        id="password"
        v-model="form.password"
        label="Senha"
        type="password"
        :error="errors.password"
        autocomplete="new-password"
        required
      />

      <BaseInput
        id="confirmPassword"
        v-model="form.confirmPassword"
        label="Confirmar senha"
        type="password"
        :error="errors.confirmPassword"
        autocomplete="new-password"
        required
      />

      <div v-if="apiErrorMessage" class="alert alert-danger py-2" role="alert">
        {{ apiErrorMessage }}
      </div>

      <BaseButton type="submit" :loading="isSubmitting">
        Criar Minha Conta
        <template #loading>Criando conta...</template>
      </BaseButton>
    </form>

    <template #footer>
      Já tem conta?
      <router-link to="/login" class="text-primary">Entrar</router-link>
    </template>
  </FormCard>
</template>
