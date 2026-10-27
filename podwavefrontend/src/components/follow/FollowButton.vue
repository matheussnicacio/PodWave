<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { toggleFollow } from '../../services/followService'

// Botão de seguir com ATUALIZAÇÃO OTIMISTA (mesmos três passos do LikeButton:
// guardar o estado anterior -> aplicar na tela e chamar a API -> na resposta,
// ajustar ao valor real ou fazer ROLLBACK).
//
// DIFERENÇA para o LikeButton: lá o botão tinha estado PRÓPRIO, inicializado a
// partir de props (`initialLiked`/`initialCount`) — o pai só entregava o valor
// inicial e não precisava saber o que acontecia depois. Aqui o número de
// seguidores aparece em OUTRO lugar da tela (o cartão do perfil) e precisa
// mudar JUNTO com o botão. Quando dois componentes precisam enxergar o MESMO
// valor, o estado deve morar no pai e o filho o edita por v-model:
// defineModel() declara essa "prop + evento update:" num só comando.
//
// Uso no pai:
//   <FollowButton :user-id="profile.id"
//                 v-model:following="profile.isFollowing"
//                 v-model:followers-count="profile.followersCount" />
const props = defineProps({
  userId: { type: [Number, String], required: true },
})

const following = defineModel('following', { type: Boolean, default: false })
const followersCount = defineModel('followersCount', { type: Number, default: 0 })

const route = useRoute()
const router = useRouter()
const { isAuthenticated } = useAuth()

// isBusy: enquanto há uma requisição em andamento, novos cliques são ignorados
// (senão o rollback de uma poderia sobrescrever o estado da outra).
const isBusy = ref(false)
const errorMessage = ref('')
let errorTimer = null

function showError(message) {
  errorMessage.value = message
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => { errorMessage.value = '' }, 4000)
}

onBeforeUnmount(() => clearTimeout(errorTimer))

async function onClick() {
  // Visitante: seguir exige login. Leva ao login guardando a rota atual em
  // ?redirect=, para voltar ao perfil depois de entrar.
  if (!isAuthenticated.value) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (isBusy.value) return

  isBusy.value = true
  errorMessage.value = ''

  // Pessoa a quem este clique se refere: se a rota mudar para outro perfil
  // enquanto a requisição voa, a resposta NÃO pode escrever no perfil novo.
  const targetId = props.userId

  // Passo 1: guardar o estado anterior.
  const previous = { following: following.value, count: followersCount.value }

  // ARMADILHA do defineModel: atribuir `following.value = x` NÃO atualiza a
  // leitura na mesma hora. O model local só reflete o novo valor depois que o
  // pai processa o evento update: e re-renderiza (próximo tick); até lá,
  // `following.value` ainda devolve o valor ANTIGO. Por isso o novo estado é
  // calculado numa variável LOCAL (nowFollowing) e é ela — nunca
  // `following.value` "logo depois de atribuir" — que decide o contador.
  const nowFollowing = !previous.following

  // Passo 2: aplicar já na tela (botão e contador do cartão, juntos).
  following.value = nowFollowing
  followersCount.value = Math.max(previous.count + (nowFollowing ? 1 : -1), 0)

  try {
    const response = await toggleFollow(targetId)
    if (props.userId !== targetId) return
    // Passo 3 (sucesso): o servidor é a fonte da verdade.
    following.value = response.data.isFollowing
    followersCount.value = response.data.followersCount
  } catch (err) {
    if (props.userId !== targetId) return
    // Passo 3 (falha): ROLLBACK para o estado guardado + aviso.
    following.value = previous.following
    followersCount.value = previous.count
    showError(err.message || 'Não foi possível atualizar. Tente novamente.')
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <div class="follow-button-wrapper">
    <button
      type="button"
      class="btn"
      :class="following ? 'btn-outline-primary' : 'btn-primary'"
      :aria-pressed="following"
      :aria-busy="isBusy"
      @click="onClick"
    >
      <i class="bi" :class="following ? 'bi-person-check' : 'bi-person-plus'"></i>
      {{ following ? 'Seguindo' : 'Seguir' }}
    </button>
    <p v-if="errorMessage" class="follow-button-error" role="alert">{{ errorMessage }}</p>
  </div>
</template>
