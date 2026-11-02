<script setup>
import { useToast } from '../../composables/useToast'

const { toasts, remove } = useToast()
</script>

<template>
  <!-- Teleport para o <body> + z-index 2000 (o BaseModal usa 1050): o toast
       aparece NA FRENTE do modal. aria-live avisa leitores de tela. -->
  <Teleport to="body">
    <div class="toast-container-pw" aria-live="polite" aria-atomic="false">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-pw"
        :class="`toast-pw-${toast.type}`"
        :role="toast.type === 'error' ? 'alert' : 'status'"
      >
        <span class="toast-pw-message">{{ toast.message }}</span>
        <button type="button" class="toast-pw-close" aria-label="Fechar aviso" @click="remove(toast.id)">&times;</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container-pw {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: min(360px, calc(100vw - 2rem));
}

.toast-pw {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  color: #fff;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.3);
}

.toast-pw-success { background: #198754; }
.toast-pw-error { background: #dc3545; }
.toast-pw-info { background: #0d6efd; }

.toast-pw-message { flex: 1; }

.toast-pw-close {
  background: none;
  border: 0;
  color: inherit;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}
</style>
