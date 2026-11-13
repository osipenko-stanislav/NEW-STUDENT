export function weightedGrade(average: number, weight: number): number {
  return Math.round((average * weight / 100 + Number.EPSILON) * 1e6) / 1e6
}
export function calculateGrade(rows: readonly { average: number; weight: number }[]) {
  const raw = Math.round(rows.reduce((sum, row) => sum + weightedGrade(row.average, row.weight), 0) * 1e6) / 1e6
  return { raw, rounded: Math.round(raw), weight: rows.reduce((sum, row) => sum + row.weight, 0) }
}
export function formatGrade(value: number | null): string {
  return value === null ? '—' : new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)
}
