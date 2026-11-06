<script setup>
import { ref } from 'vue'
import BaseModal from '../base/BaseModal.vue'
import BaseButton from '../base/BaseButton.vue'
import { reportEpisode } from '../../services/reportService'
import { REPORT_REASONS } from '../../config/constants'

// Modal "Denunciar". É um FORMULÁRIO: erro (sem motivo, 409 "você já
// denunciou", rede) aparece aqui dentro, nunca em toast (o service manda
// silent: true). O sucesso é avisado pelo pai, com toast.success.
//
// Os rádios mandam a CHAVE (:value="reason.value") e mostram o RÓTULO.
// novalidate + validação própria: sem motivo, a mensagem aparece e nenhuma
// requisição sai.
const props = defineProps({
  episodeId: { type: [Number, String], required: true },
})

const emit = defineEmits(['close', 'reported'])

const FORM_ID = 'report-episode-form'

const selectedReason = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function onSubmit() {
  if (isSubmitting.value) return
  errorMessage.value = ''

  if (!selectedReason.value) {
    errorMessage.value = 'Escolha um motivo para continuar.'
    return
  }

  isSubmitting.value = true
  try {
    await reportEpisode(props.episodeId, selectedReason.value)
    emit('reported')
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <BaseModal :open="true" title="Denunciar episódio" :busy="isSubmitting" @close="emit('close')">
    <form :id="FORM_ID" novalidate @submit.prevent="onSubmit">
      <!-- fieldset :disabled trava os cinco rádios de uma vez durante o envio. -->
      <fieldset :disabled="isSubmitting">
        <legend class="fs-6 mb-2">Por que este episódio deve ser revisado pela moderação?</legend>

        <div v-for="reason in REPORT_REASONS" :key="reason.value" class="form-check mb-1">
          <input
            :id="`report-reason-${reason.value}`"
            v-model="selectedReason"
            class="form-check-input"
            type="radio"
            name="report-reason"
            :value="reason.value"
          />
          <label class="form-check-label" :for="`report-reason-${reason.value}`">{{ reason.label }}</label>
        </div>
      </fieldset>

      <div v-if="errorMessage" class="alert alert-danger py-2 mt-3 mb-0" role="alert">{{ errorMessage }}</div>
    </form>

    <template #footer>
      <BaseButton variant="outline-secondary" :block="false" :disabled="isSubmitting" @click="emit('close')">
        Cancelar
      </BaseButton>
      <BaseButton type="submit" :form="FORM_ID" variant="danger" :block="false" :loading="isSubmitting">
        Enviar denúncia
        <template #loading>Enviando...</template>
      </BaseButton>
    </template>
  </BaseModal>
</template>
