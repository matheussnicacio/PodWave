<script setup>
// Checagem de alcançabilidade (Atividade 15, Seção 8) — caminhos de clique:
//  - Painel: Sidebar -> "Admin" (só para administrador) -> /admin, que redireciona para cá
//  - Denúncias: aba "Denúncias" e o cartão vermelho de pendentes, aqui no Dashboard
//  - Usuários / Episódios: as abas do painel (AdminLayout)
//  - Revisar / Bloquear / Excluir: botões na linha (bloquear e excluir abrem confirmação; desbloquear é direto)
//  - Filtrar / buscar: grupo de botões (Denúncias); campo com debounce (Usuários e Episódios)
//  - Ver o episódio / o perfil: capa ou título (Denúncias e Episódios); @usuário (Usuários)
import { useAsyncData } from '../../composables/useAsyncData'
import { getAdminDashboard } from '../../services/adminService'
import { formatCount } from '../../utils/format'

const { data: stats, isLoading, error, execute } = useAsyncData(getAdminDashboard)

// Os cartões IGUAIS saem de uma lista (v-for): acrescentar um número novo é
// acrescentar uma linha aqui. `key` é a chave do objeto que a API devolve.
// O cartão das denúncias PENDENTES fica de fora, de propósito: ele é
// diferente (vermelho e é um link para a aba Denúncias).
const cards = [
  { key: 'users', label: 'Usuários', icon: 'bi-people' },
  { key: 'blockedUsers', label: 'Bloqueados', icon: 'bi-person-x' },
  { key: 'episodes', label: 'Episódios', icon: 'bi-mic' },
  { key: 'comments', label: 'Comentários', icon: 'bi-chat-dots' },
  { key: 'likes', label: 'Curtidas', icon: 'bi-heart' },
  { key: 'reviewedReports', label: 'Denúncias revisadas', icon: 'bi-check2-circle' },
]
</script>

<template>
  <section aria-labelledby="dashboard-title">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 id="dashboard-title" class="h5 mb-0">Visão geral</h2>
      <button type="button" class="btn btn-outline-primary btn-sm" :disabled="isLoading" @click="execute">
        <i class="bi bi-arrow-clockwise"></i> Atualizar
      </button>
    </div>

    <!-- Ordem: carregando -> erro -> conteúdo. Um 403 (rebaixado, ou o
         isAdmin falsificado no localStorage) aparece AQUI, no lugar dos
         números: a guarda do front deixou entrar, a API não. -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
      <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="execute">Tentar de novo</button>
    </div>

    <div v-else-if="stats" class="stats-grid">
      <router-link :to="{ name: 'admin-reports' }" class="stat-card stat-card-alert">
        <i class="bi bi-flag-fill stat-icon" aria-hidden="true"></i>
        <span class="stat-value">{{ formatCount(stats.pendingReports) }}</span>
        <span class="stat-label">Denúncias pendentes <i class="bi bi-arrow-right"></i></span>
      </router-link>

      <div v-for="card in cards" :key="card.key" class="stat-card">
        <i class="bi stat-icon" :class="card.icon" aria-hidden="true"></i>
        <span class="stat-value">{{ formatCount(stats[card.key]) }}</span>
        <span class="stat-label">{{ card.label }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.25rem;
  border: 1px solid var(--pw-border, #dee2e6);
  border-radius: 12px;
  background-color: var(--pw-surface, #fff);
  color: inherit;
  text-decoration: none;
}

.stat-icon {
  font-size: 1.5rem;
  opacity: 0.7;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.stat-card-alert {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
}

.stat-card-alert:hover {
  background-color: #bb2d3b;
  color: #fff;
}
</style>
