import { useSyncExternalStore } from 'react'
import { actionStatus } from '@/lib/action-status'
import { parseWeekPlan, weekPlanStorageKey, type PersonalStudyBlock } from '@/lib/week-plan'
let snapshot: PersonalStudyBlock[] | undefined
let cachedRaw: string | null | undefined
const listeners = new Set<() => void>()
function read() {
  try {
    const raw = localStorage.getItem(weekPlanStorageKey)
    if (!snapshot || raw !== cachedRaw) { snapshot = parseWeekPlan(raw); cachedRaw = raw }
  } catch { snapshot ??= [] }
  return snapshot!
}
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
window.addEventListener('storage', event => {
  if (event.key === weekPlanStorageKey || event.key === null) { snapshot = undefined; listeners.forEach(listener => listener()) }
})
export function useWeekPlan() {
  const blocks = useSyncExternalStore(subscribe, read)
  function update(change: (current: PersonalStudyBlock[]) => PersonalStudyBlock[]) {
    let next: PersonalStudyBlock[]
    try {
      next = change(parseWeekPlan(localStorage.getItem(weekPlanStorageKey)))
      const raw = JSON.stringify({ version: 1, blocks: next })
      localStorage.setItem(weekPlanStorageKey, raw)
      cachedRaw = raw
    } catch { actionStatus.report({ key: 'week-plan', label: 'Не удалось сохранить личный план', detail: 'Попробуй еще раз' }, false); return }
    snapshot = next
    listeners.forEach(listener => listener())
  }
  return { blocks, update }
}
