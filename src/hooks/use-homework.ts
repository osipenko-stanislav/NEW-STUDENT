import { useEffect, useSyncExternalStore } from 'react'
import { academicTasks } from '@/data/academic-data'
import { canSkipHomework, emptyHomework, homeworkStorageKey, parseHomeworkRecords, type HomeworkRecord } from '@/lib/homework-storage'
let records: Record<string, HomeworkRecord> | undefined
let lastRaw: string | null | undefined
const listeners = new Set<() => void>()
function snapshot() {
  let raw: string | null = null
  try { raw = localStorage.getItem(homeworkStorageKey) } catch { return records ?? (records = {}) }
  if (!records || raw !== lastRaw) { records = parseHomeworkRecords(raw); lastRaw = raw }
  return records
}
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
export function refreshHomeworkRecords() {
  records = undefined
  listeners.forEach(listener => listener())
}
window.addEventListener('storage', event => {
  if (event.key === homeworkStorageKey || event.key === null) refreshHomeworkRecords()
})
export function updateHomework(id: string, update: (record: HomeworkRecord) => HomeworkRecord) {
  const previous = snapshot()
  const updated = update(previous[id] ?? emptyHomework())
  const next = { ...previous, [id]: updated.submittedAt ? { ...updated, skipped: undefined } : updated }
  try { localStorage.setItem(homeworkStorageKey, JSON.stringify(next)) } catch { return false }
  lastRaw = JSON.stringify(next)
  records = next
  listeners.forEach(listener => listener())
  return true
}
export function useHomeworkRecords() { return useSyncExternalStore(subscribe, snapshot) }
export function homeworkEvent(text: string) { return { id: crypto.randomUUID(), at: Date.now(), text } }

// Keep saved timed solutions moving to review even after leaving the assignment page.
export function useHomeworkTimers() {
  const records = useHomeworkRecords()
  useEffect(() => {
    const active = academicTasks.filter(task => task.timeLimitMinutes && records[task.id]?.startedAt && records[task.id]?.savedAt && !records[task.id]?.submittedAt)
    if (!active.length) return
    const end = (task: typeof active[number]) => records[task.id].startedAt! + task.timeLimitMinutes! * 60000
    const next = Math.min(...active.map(end))
    const timer = setTimeout(() => {
      for (const task of active) if (end(task) <= Date.now()) updateHomework(task.id, current => current.submittedAt ? current : ({ ...current, submittedAt: Date.now(), events: [...current.events, homeworkEvent('Время вышло. Решение отправлено на проверку')] }))
    }, Math.min(2147483647, Math.max(0, next - Date.now())))
    return () => clearTimeout(timer)
  }, [records])
}

export function setHomeworkSkipped(id: string, skipped: boolean) {
  const task = academicTasks.find(task => task.id === id)
  const record = snapshot()[id]
  if (!task || (skipped && !canSkipHomework(task, record))) return false
  if (!!record?.skipped === skipped) return true
  return updateHomework(id, current => ({ ...current, skipped: skipped || undefined }))
}
