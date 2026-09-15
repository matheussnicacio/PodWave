<script setup>
// FormCard é o "molde" visual repetido em Registro, Login e Edição de
// Perfil: cabeçalho centralizado (ícone de marca + título + subtítulo) e,
// logo abaixo, o card com borda superior na cor de marca
// (.podwave-auth-card, já definida em assets/main.css desde a Aula 04).
// Cada tela só entra com o que muda de verdade: o próprio formulário,
// passado via slot default.
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' }, // classe de um ícone do Bootstrap Icons, ex.: "bi-person-plus"
  // 'sm' (col-lg-4): Registro/Login, formulários curtos.
  // 'md' (col-lg-6): Edição de Perfil, que também carrega a foto de perfil.
  width: { type: String, default: 'sm' },
})

const widthClass = props.width === 'md' ? 'col-12 col-md-8 col-lg-6' : 'col-12 col-sm-8 col-md-6 col-lg-4'
</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div :class="widthClass" class="py-5">
        <div class="text-center mb-4">
          <div class="podwave-brand-icon mx-auto mb-3">
            <i v-if="props.icon" class="bi" :class="props.icon"></i>
            <span v-else>PW</span>
          </div>
          <h1 class="h3 mb-1">{{ props.title }}</h1>
          <p v-if="props.subtitle" class="text-secondary">{{ props.subtitle }}</p>
        </div>

        <div class="card podwave-auth-card shadow-sm">
          <div class="card-body p-4">
            <slot />
          </div>
        </div>

        <div v-if="$slots.footer" class="text-center text-secondary mt-3 mb-0">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </div>
</template>
