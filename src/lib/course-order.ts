export const courseOrderStorageKey = 'student-course-order:v1'
export function normalizeCourseOrder(value: unknown, ids: readonly string[]): string[] {
  const allowed = new Set(ids)
  const saved = Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && allowed.has(id)) : []
  return [...new Set([...saved, ...ids])]
}
export function loadCourseOrder(ids: readonly string[]): { order: string[]; error: string | null } {
  try {
    const raw = localStorage.getItem(courseOrderStorageKey)
    const value = raw ? JSON.parse(raw) : null
    if (value !== null && (!Array.isArray(value) || !value.every(id => typeof id === 'string'))) throw new Error('Invalid order')
    return { order: normalizeCourseOrder(value, ids), error: null }
  } catch { return { order: [...ids], error: 'Не удалось восстановить порядок курсов. Проверь доступ к хранилищу браузера.' } }
}
export function moveCourse(order: readonly string[], id: string, targetId: string, after = false): string[] {
  if (id === targetId || !order.includes(id) || !order.includes(targetId)) return [...order]
  const next = order.filter(item => item !== id)
  next.splice(next.indexOf(targetId) + Number(after), 0, id)
  return next
}
export function saveCourseOrder(order: readonly string[]): void { localStorage.setItem(courseOrderStorageKey, JSON.stringify(order)) }
