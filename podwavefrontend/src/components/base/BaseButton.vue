<script setup>
// BaseButton concentra o padrão de botão de submit dos três formulários:
// classe Bootstrap por variante, largura total (w-100), estado desabilitado
// automático enquanto `loading` é true, e a troca de texto
// ("Entrar" -> "Entrando...") feita via slots nomeados, em vez de cada
// tela repetir o mesmo :disabled="isSubmitting" e a mesma interpolação
// condicional no template.
const props = defineProps({
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' }, // qualquer variante do Bootstrap (primary, secondary, outline-primary...)
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: true },
})
</script>

<template>
  <button
    :type="props.type"
    class="btn"
    :class="[`btn-${props.variant}`, { 'w-100': props.block }]"
    :disabled="props.disabled || props.loading"
  >
    <span
      v-if="props.loading"
      class="spinner-border spinner-border-sm me-2"
      role="status"
      aria-hidden="true"
    ></span>
    <slot v-if="props.loading" name="loading">Enviando...</slot>
    <slot v-else><!-- texto padrão do botão, se o pai não passar nada --></slot>
  </button>
</template>
