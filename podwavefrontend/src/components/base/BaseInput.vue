<script setup>
// BaseInput centraliza o "esqueleto" repetido em todo campo de formulário
// do PodWave: label + input/textarea + mensagem de erro (Bootstrap
// .is-invalid/.invalid-feedback) + texto de ajuda opcional.
//
// defineModel() substitui a dupla `props: ['modelValue']` + `emits:
// ['update:modelValue']` que cada componente precisaria declarar na mão
// para suportar v-model. Aqui, `const model = defineModel(...)` já cria
// essa prop e esse emit por baixo dos panos, então basta usar `v-model=
// "model"` no <input>/<textarea> interno — o componente pai continua
// usando v-model="algumaCoisa" normalmente, sem saber (nem precisar saber)
// que por dentro isso virou uma prop+emit.
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  as: { type: String, default: 'input' }, // 'input' | 'textarea'
  error: { type: String, default: '' },
  helpText: { type: String, default: '' },
  required: { type: Boolean, default: false },
  autocomplete: { type: String, default: null },
  maxlength: { type: [String, Number], default: null },
  rows: { type: [String, Number], default: 3 },
})

const model = defineModel({ type: [String, Number], default: '' })
</script>

<template>
  <div class="mb-3">
    <label :for="props.id" class="form-label">{{ props.label }}</label>

    <textarea
      v-if="props.as === 'textarea'"
      :id="props.id"
      v-model="model"
      class="form-control"
      :class="{ 'is-invalid': props.error }"
      :rows="props.rows"
      :maxlength="props.maxlength"
      :required="props.required"
    ></textarea>

    <input
      v-else
      :id="props.id"
      v-model="model"
      :type="props.type"
      class="form-control"
      :class="{ 'is-invalid': props.error }"
      :autocomplete="props.autocomplete"
      :maxlength="props.maxlength"
      :required="props.required"
    />

    <div v-if="props.error" class="invalid-feedback">{{ props.error }}</div>
    <div v-if="props.helpText" class="form-text">{{ props.helpText }}</div>
  </div>
</template>
