<script setup>
import { onBeforeUnmount, watch } from 'vue'

// BaseModal é GENÉRICO: não sabe nada de episódio nem de exclusão. Quem usa
// decide o título e o conteúdo (slot default) e os botões (slot `footer`).
//
// Por que <Teleport to="body">: o modal é renderizado direto no <body>, fora
// de qualquer card/grade. Se ele ficasse DENTRO do card, herdaria o contexto
// dele — o card tem `transform` no :hover, e um ancestral com transform vira
// o "bloco de contenção" de elementos position: fixed, então o modal ficaria
// posicionado em relação ao card (e não à tela). Fora do card, o
// position: fixed é sempre relativo à janela, centralizado de verdade.
//
// A visibilidade é controlada pelo PAI (prop `open`); o modal só PEDE para
// fechar, emitindo `close` (X, clique no fundo escuro ou Esc).
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  // true enquanto uma operação está em andamento: impede fechar por Esc/fundo/X.
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

function requestClose() {
  if (props.busy) return
  emit('close')
}

function onKeydown(event) {
  if (event.key === 'Escape') requestClose()
}

// O listener de Esc só existe enquanto o modal está aberto.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <!-- @click.self: só fecha se o clique foi no FUNDO escuro em si, não em
         um filho (a caixa branca) — clicar dentro da caixa não fecha. -->
    <div v-if="open" class="pw-modal-backdrop" @click.self="requestClose">
      <div class="pw-modal-box" role="dialog" aria-modal="true" :aria-label="title">
        <div class="pw-modal-header">
          <h2 class="h5 mb-0">{{ title }}</h2>
          <button type="button" class="btn-close" aria-label="Fechar" :disabled="busy" @click="requestClose"></button>
        </div>
        <div class="pw-modal-body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="pw-modal-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
/* Sem scoped: o conteúdo é teleportado para o <body>. As classes têm prefixo
   pw-modal- para não colidir com nenhuma outra. */
.pw-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1050;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.pw-modal-box {
  background-color: var(--pw-surface, #fff);
  color: var(--pw-text, #212529);
  border-radius: 12px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}

.pw-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--pw-border, #dee2e6);
}

.pw-modal-body {
  padding: 1.25rem;
}

.pw-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem 1.25rem;
}
</style>
