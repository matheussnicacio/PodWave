import { ref } from 'vue'
import { TOAST_DURATION } from '../config/constants'

// SINGLETON: a lista de toasts mora FORA da função useToast(), no escopo do
// módulo. Todo mundo que chama useToast() recebe a MESMA lista reativa — o
// ToastContainer (componente) e o interceptor do Axios (api.js, que não é
// componente e não está dentro de nenhum setup()).
//
// Vantagem sobre uma store do Pinia neste caso: useToast() funciona em
// qualquer arquivo, a qualquer hora, sem exigir um Pinia ativo (api.js é
// carregado antes do app.use(pinia) terminar de montar e já é parte de um
// ciclo store -> service -> api). Para uma lista simples, sem persistência,
// sem devtools e sem getters, uma store seria cerimônia sem ganho.
const toasts = ref([])
let nextId = 1

function remove(id) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function show(message, type = 'info', duration) {
  const id = nextId++
  const ms = duration ?? TOAST_DURATION[type.toUpperCase()] ?? TOAST_DURATION.INFO
  toasts.value.push({ id, message, type })
  setTimeout(() => remove(id), ms)
  return id
}

export function useToast() {
  return {
    toasts,
    show,
    remove,
    success: (message, duration) => show(message, 'success', duration),
    error: (message, duration) => show(message, 'error', duration),
    info: (message, duration) => show(message, 'info', duration),
  }
}
