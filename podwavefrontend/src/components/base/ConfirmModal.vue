<script setup>
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

// Aula 15 — confirmação genérica (bloquear usuário, excluir episódio), feita
// SOBRE o BaseModal: ele cuida do fundo escuro, do Esc e do Teleport; aqui só
// entram o texto e os dois botões.
//
// Quem usa controla tudo: mostra com v-if, decide o que acontece no `confirm`
// e fecha (ou não) depois da resposta da API. `busy` = a chamada está em
// andamento: os botões ficam desabilitados, o de confirmar mostra
// "Aguarde..." e o BaseModal não fecha por Esc/fundo/X.
defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmLabel: { type: String, default: 'Confirmar' },
  confirmVariant: { type: String, default: 'danger' },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'close'])
</script>

<template>
  <BaseModal :open="true" :title="title" :busy="busy" @close="emit('close')">
    <p class="mb-0 confirm-message">{{ message }}</p>

    <template #footer>
      <BaseButton variant="outline-secondary" :block="false" :disabled="busy" @click="emit('close')">
        Cancelar
      </BaseButton>
      <BaseButton :variant="confirmVariant" :block="false" :loading="busy" @click="emit('confirm')">
        {{ confirmLabel }}
        <template #loading>Aguarde...</template>
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
/* A mensagem pode ter quebras de linha (\n) — ex.: a lista do que será apagado. */
.confirm-message {
  white-space: pre-line;
}
</style>
