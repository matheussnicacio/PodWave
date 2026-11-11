<script setup>
import { useAuthenticatedAction } from '../../composables/useAuthenticatedAction'
import { toggleFollow } from '../../services/followService'
import { runOptimistic } from '../../utils/optimistic'

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

// "Cerca" (visitante -> login) e isBusy (uma requisição por vez) vêm do
// composable; o toast de erro vem do interceptor. Aqui o catch só desfaz o visual.
const { run, isBusy } = useAuthenticatedAction()

// Aula 13: os três passos agora vêm de runOptimistic (utils/optimistic.js).
// O que muda em relação ao LikeButton: o estado mora no PAI (defineModel) e a
// resposta só pode escrever se a tela ainda mostra a MESMA pessoa.
function onClick() {
  return run(() => {
    // Pessoa a quem este clique se refere: se a rota mudar para outro perfil
    // enquanto a requisição voa, a resposta NÃO pode escrever no perfil novo.
    const targetId = props.userId

    return runOptimistic({
      apply: () => {
        // Passo 1: guardar o estado anterior.
        const previous = { following: following.value, count: followersCount.value }

        // ARMADILHA do defineModel: atribuir `following.value = x` NÃO atualiza a
        // leitura na mesma hora (só depois que o pai processa o update:). Por isso
        // o novo estado é calculado numa variável LOCAL e é ela que decide o contador.
        const nowFollowing = !previous.following

        // Passo 2: aplicar já na tela (botão e contador do cartão, juntos).
        following.value = nowFollowing
        followersCount.value = Math.max(previous.count + (nowFollowing ? 1 : -1), 0)

        // Passo 3 (falha): ROLLBACK. O toast de erro vem do interceptor.
        return () => {
          if (props.userId !== targetId) return
          following.value = previous.following
          followersCount.value = previous.count
        }
      },
      request: () => toggleFollow(targetId),
      // Passo 3 (sucesso): o servidor é a fonte da verdade.
      confirm: (data) => {
        if (props.userId !== targetId) return
        following.value = data.isFollowing
        followersCount.value = data.followersCount
      },
    })
  })
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
  </div>
</template>
