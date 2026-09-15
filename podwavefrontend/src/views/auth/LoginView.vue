<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import BaseInput from '../../components/base/BaseInput.vue'
import BaseButton from '../../components/base/BaseButton.vue'
import FormCard from '../../components/base/FormCard.vue'

const route = useRoute()
const router = useRouter()
const { login } = useAuth()

const form = reactive({
  email: '',
  password: '',
})

const apiErrorMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  apiErrorMessage.value = ''
  isSubmitting.value = true

  try {
    await login({ email: form.email.trim(), password: form.password })

    // Destino padrão pós-login: a rota principal do projeto (Feed).
    // Se o usuário chegou aqui redirecionado de uma rota protegida
    // (?redirect=...), volta exatamente para onde estava.
    const redirectTo = typeof route.query.redirect === 'string' ? route.query.redirect : { name: 'feed' }
    router.push(redirectTo)
  } catch (error) {
    apiErrorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <FormCard title="Entrar no PodWave" subtitle="Acesse sua conta para continuar" icon="bi-box-arrow-in-right">
    <form novalidate @submit.prevent="handleSubmit">
      <BaseInput
        id="email"
        v-model="form.email"
        label="E-mail"
        type="email"
        autocomplete="email"
        required
      />

      <BaseInput
        id="password"
        v-model="form.password"
        label="Senha"
        type="password"
        autocomplete="current-password"
        required
      />

      <div v-if="apiErrorMessage" class="alert alert-danger py-2" role="alert">
        {{ apiErrorMessage }}
      </div>

      <BaseButton type="submit" :loading="isSubmitting">
        Entrar
        <template #loading>Entrando...</template>
      </BaseButton>
    </form>

    <template #footer>
      Ainda não tem conta?
      <router-link to="/register" class="text-primary">Criar conta</router-link>
    </template>
  </FormCard>
</template>
