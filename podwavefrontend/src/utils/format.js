// Formatadores de exibição (só apresentação — nenhuma regra de negócio).

const countFormatter = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

/**
 * Contador compacto: 0 -> "0", 999 -> "999", 1200 -> "1,2 mil".
 * Valores ausentes/inválidos viram "0" (um card nunca mostra "undefined").
 */
export function formatCount(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return '0'
  return countFormatter.format(n)
}

/** Data/hora curta em pt-BR ("08/10/2026 20:15"); "" se a data for inválida. */
export function formatDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return dateTimeFormatter.format(date)
}
