<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

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
    await authStore.login({ email: form.email.trim(), password: form.password })

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
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 col-sm-8 col-md-6 col-lg-4 py-5">
        <div class="text-center mb-4">
          <div class="podwave-brand-icon mx-auto mb-3">PW</div>
          <h1 class="h3 mb-1">Entrar no PodWave</h1>
          <p class="text-secondary">Acesse sua conta para continuar</p>
        </div>

        <div class="card podwave-auth-card shadow-sm">
          <div class="card-body p-4">
            <form novalidate @submit.prevent="handleSubmit">
              <div class="mb-3">
                <label for="email" class="form-label">E-mail</label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  class="form-control"
                  autocomplete="email"
                  required
                />
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Senha</label>
                <input
                  id="password"
                  v-model="form.password"
                  type="password"
                  class="form-control"
                  autocomplete="current-password"
                  required
                />
              </div>

              <div v-if="apiErrorMessage" class="alert alert-danger py-2" role="alert">
                {{ apiErrorMessage }}
              </div>

              <button type="submit" class="btn btn-primary w-100" :disabled="isSubmitting">
                {{ isSubmitting ? 'Entrando...' : 'Entrar' }}
              </button>
            </form>
          </div>
        </div>

        <p class="text-center text-secondary mt-3 mb-0">
          Ainda não tem conta?
          <router-link to="/register" class="text-primary">Criar conta</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
