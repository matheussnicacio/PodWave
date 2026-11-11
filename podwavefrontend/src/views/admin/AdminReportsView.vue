<script setup>
import { reactive, ref } from 'vue'
import { usePaginatedList } from '../../composables/usePaginatedList'
import { useToast } from '../../composables/useToast'
import { getAdminReports, reviewAdminReport } from '../../services/adminService'
import { REPORT_FILTERS, REPORT_REASONS } from '../../config/constants'
import { getEpisodeCoverUrl } from '../../utils/media'
import { formatDateTime } from '../../utils/format'

const toast = useToast()

// Filtro atual (o valor vai como ?status=). Padrão: pendentes.
const statusFilter = ref('pending')

// A receita LÊ statusFilter.value na hora de buscar; o { watch: statusFilter }
// faz a lista recomeçar da página 1 quando o filtro muda. `undefined` no
// segundo parâmetro = tamanho de página padrão.
const { items: reports, hasMore, isLoading, error, isEmpty, loadMore, reload } = usePaginatedList(
  (page, limit) => getAdminReports(statusFilter.value, page, limit),
  undefined,
  { watch: statusFilter }
)

// chave -> rótulo em português, montado da MESMA lista do modal de denúncia
// (a API guarda a chave; o texto é da tela).
const reasonLabels = Object.fromEntries(REPORT_REASONS.map((reason) => [reason.value, reason.label]))

// "Cerca" POR LINHA: ids com requisição em andamento. Clique duplo = uma requisição.
const busyIds = reactive(new Set())

// Ação do administrador ESPERA o servidor (sem runOptimistic): a linha só
// muda para "revisada" depois que a API confirmou, e com o que a API devolveu
// (status e reviewedAt REAIS). Moderação não é curtida: se a tela mostrasse
// "revisada" e a requisição falhasse, o moderador seguiria em frente achando
// que tratou uma denúncia que continua pendente.
async function markAsReviewed(report) {
  if (busyIds.has(report.id)) return
  busyIds.add(report.id)
  try {
    const response = await reviewAdminReport(report.id)
    report.status = response.data.status
    report.reviewedAt = response.data.reviewedAt
    toast.success(response.message)
  } catch {
    // Vazio de propósito: o toast de erro é do interceptor (api.js). Um
    // toast.error aqui duplicaria o aviso. A linha continua pendente.
  } finally {
    busyIds.delete(report.id)
  }
}
</script>

<template>
  <section aria-labelledby="reports-title">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <h2 id="reports-title" class="h5 mb-0">Denúncias</h2>

      <div class="d-flex gap-2">
        <div class="btn-group btn-group-sm" role="group" aria-label="Filtrar denúncias por situação">
          <button
            v-for="filter in REPORT_FILTERS"
            :key="filter.value"
            type="button"
            class="btn"
            :class="statusFilter === filter.value ? 'btn-primary' : 'btn-outline-primary'"
            :aria-pressed="statusFilter === filter.value"
            @click="statusFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
        <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="isLoading" @click="reload">
          <i class="bi bi-arrow-clockwise"></i> Atualizar
        </button>
      </div>
    </div>

    <div v-if="isLoading && reports.length === 0" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <div v-else-if="error && reports.length === 0" class="alert alert-danger" role="alert">
      {{ error }}
      <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="reload">Tentar de novo</button>
    </div>

    <p v-else-if="isEmpty" class="text-secondary">
      Nenhuma denúncia {{ statusFilter === 'pending' ? 'pendente' : statusFilter === 'reviewed' ? 'revisada' : '' }} por aqui.
    </p>

    <template v-else>
      <ul class="admin-list">
        <li v-for="report in reports" :key="report.id" class="admin-row">
          <router-link
            v-if="report.episode"
            :to="{ name: 'podcast-detail', params: { id: report.episode.id } }"
            class="flex-shrink-0"
          >
            <img :src="getEpisodeCoverUrl(report.episode.cover)" :alt="`Capa de ${report.episode.title}`" class="admin-thumb" loading="lazy" />
          </router-link>

          <div class="admin-row-body">
            <router-link
              v-if="report.episode"
              :to="{ name: 'podcast-detail', params: { id: report.episode.id } }"
              class="fw-semibold"
            >
              {{ report.episode.title }}
            </router-link>
            <div class="small text-secondary">
              de
              <router-link :to="{ name: 'public-profile', params: { username: report.episode?.author?.username } }">
                @{{ report.episode?.author?.username }}
              </router-link>
            </div>
            <div class="d-flex flex-wrap align-items-center gap-2 mt-1">
              <span class="badge text-bg-light border">{{ reasonLabels[report.reason] || report.reason }}</span>
              <span v-if="report.status === 'pending'" class="badge text-bg-warning">Pendente</span>
              <span v-else class="badge text-bg-success">Revisada</span>
            </div>
            <div class="small text-secondary mt-1">
              Denunciado por @{{ report.Reporter?.username }} em {{ formatDateTime(report.createdAt) }}
              <template v-if="report.reviewedAt"> · revisada em {{ formatDateTime(report.reviewedAt) }}</template>
            </div>
          </div>

          <button
            v-if="report.status === 'pending'"
            type="button"
            class="btn btn-sm btn-outline-success flex-shrink-0"
            :disabled="busyIds.has(report.id)"
            @click="markAsReviewed(report)"
          >
            <template v-if="busyIds.has(report.id)">
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span> Salvando...
            </template>
            <template v-else><i class="bi bi-check2"></i> Marcar como revisada</template>
          </button>
        </li>
      </ul>

      <div v-if="error" class="alert alert-danger mt-3" role="alert">
        {{ error }}
        <button type="button" class="btn btn-link alert-link p-0 ms-2" @click="loadMore">Tentar de novo</button>
      </div>

      <div v-if="hasMore" class="text-center mt-3">
        <button type="button" class="btn btn-outline-primary" :disabled="isLoading" @click="loadMore">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          Carregar mais
        </button>
      </div>
    </template>
  </section>
</template>
