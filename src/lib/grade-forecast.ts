import type { FormulaRow } from '../data/grade-fixtures.ts'

export type ForecastTask = { id: string; title: string; activityId: string; grade: number | null; status: string }
export type ForecastWork = ForecastTask & { weight: number }
// Local scenario convention, not an institutional grading policy.
export function forecastWorks(formula: readonly FormulaRow[], tasks: readonly ForecastTask[]) {
  if (!formula.length || new Set(formula.map(row => row.id)).size !== formula.length || new Set(tasks.map(task => task.id)).size !== tasks.length) return null
  const works: ForecastWork[] = []
  for (const row of formula) {
    const group = tasks.filter(task => task.activityId === row.id)
    if (!Number.isFinite(row.weight) || row.weight < 0 || !Number.isInteger(row.total) || !row.total || row.total < 0 || group.length !== row.total) return null
    for (const task of group) {
      if (task.status === 'accepted' && task.grade === null) return null
      if (task.grade !== null && (!Number.isFinite(task.grade) || task.grade < 0 || task.grade > 10 || task.status !== 'accepted')) return null
      works.push({ ...task, weight: row.weight / 100 / row.total })
    }
  }
  return works.length === tasks.length ? works : null
}
export function calculateForecast(works: readonly ForecastWork[], expected: Readonly<Record<string, number>>, target: number) {
  const current = works.reduce((sum, work) => sum + (work.grade ?? 0) * work.weight, 0)
  const remaining = works.filter(work => work.grade === null)
  const remainingWeight = remaining.reduce((sum, work) => sum + work.weight, 0)
  const maximum = current + remainingWeight * 10
  const projected = current + remaining.reduce((sum, work) => sum + Math.max(0, Math.min(10, expected[work.id] ?? 0)) * work.weight, 0)
  const needed = Math.max(0, target - current)
  return { current, maximum, projected, remaining, reachable: target <= maximum + 1e-9, required: remainingWeight > 0 ? needed / remainingWeight : null, achieved: target <= current + 1e-9 }
}
