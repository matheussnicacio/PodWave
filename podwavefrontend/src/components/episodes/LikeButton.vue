<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { toggleLike } from '../../services/likeService'
import { formatCount } from '../../utils/format'

// Botão de curtir com ATUALIZAÇÃO OTIMISTA.
//
// Atualização otimista = assumir que a API vai aceitar e mostrar o resultado
// ANTES da resposta chegar, para a interface responder na hora (mesmo em
// Slow 4G). São três passos:
//   1) GUARDAR o estado anterior (liked + contador);
//   2) APLICAR a mudança na tela imediatamente e só então chamar a API;
//   3) na resposta: se deu certo, ajustar ao valor REAL do servidor; se
//      falhou, ROLLBACK — voltar ao estado guardado e avisar o erro.
//
// Quando NÃO usar: quando falhar é comum ou caro de desfazer (pagamento,
// exclusão definitiva, ação com efeito externo irreversível) ou quando o
// resultado depende de uma regra que só o servidor conhece. Curtir é barato,
// reversível e quase sempre dá certo — o caso ideal.
const props = defineProps({
  episodeId: { type: [Number, String], required: true },
  initialLiked: { type: Boolean, default: false },
  initialCount: { type: Number, default: 0 },
})

const emit = defineEmits(['change'])

const route = useRoute()
const router = useRouter()
const { isAuthenticated } = useAuth()

const liked = ref(props.initialLiked)
const count = ref(props.initialCount)
// isBusy: enquanto há uma requisição em andamento, novos cliques são
// ignorados. Sem isso, cliques rápidos disparariam várias requisições
// concorrentes e o rollback de uma poderia sobrescrever o estado da outra.
const isBusy = ref(false)
const errorMessage = ref('')
let errorTimer = null

// Se o pai receber novos dados (outro episódio, ou a carga terminou depois do
// primeiro render), o botão acompanha.
watch(
  () => [props.initialLiked, props.initialCount, props.episodeId],
  () => {
    liked.value = props.initialLiked
    count.value = props.initialCount
  }
)

function showError(message) {
  errorMessage.value = message
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => { errorMessage.value = '' }, 4000)
}

onBeforeUnmount(() => clearTimeout(errorTimer))

async function onClick() {
  // Visitante: curtir exige login. Leva ao login guardando a rota atual em
  // ?redirect=, para voltar ao detalhe depois de entrar.
  if (!isAuthenticated.value) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (isBusy.value) return

  isBusy.value = true
  errorMessage.value = ''

  // Passo 1: guardar o estado anterior.
  const previous = { liked: liked.value, count: count.value }

  // Passo 2: aplicar já na tela.
  liked.value = !previous.liked
  count.value = Math.max(previous.count + (liked.value ? 1 : -1), 0)
  emit('change', { liked: liked.value, likesCount: count.value })

  try {
    const response = await toggleLike(props.episodeId)
    // Passo 3 (sucesso): o servidor é a fonte da verdade — se outra pessoa
    // curtiu nesse meio-tempo, o contador real prevalece.
    liked.value = response.data.liked
    count.value = response.data.likesCount
    emit('change', { liked: liked.value, likesCount: count.value })
  } catch (err) {
    // Passo 3 (falha): ROLLBACK para o estado guardado + aviso.
    liked.value = previous.liked
    count.value = previous.count
    emit('change', { liked: liked.value, likesCount: count.value })
    showError(err.message || 'Não foi possível registrar sua curtida. Tente novamente.')
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <div class="like-button-wrapper">
    <button
      type="button"
      class="like-button"
      :class="{ 'is-liked': liked }"
      :aria-pressed="liked"
      :aria-label="liked ? 'Descurtir episódio' : 'Curtir episódio'"
      :aria-busy="isBusy"
      @click="onClick"
    >
      <i class="bi" :class="liked ? 'bi-heart-fill' : 'bi-heart'"></i>
      <span class="like-button-count">{{ formatCount(count) }}</span>
    </button>
    <p v-if="errorMessage" class="like-button-error" role="alert">{{ errorMessage }}</p>
  </div>
</template>
