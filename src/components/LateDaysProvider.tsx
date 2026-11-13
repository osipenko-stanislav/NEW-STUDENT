import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { academicTasks, type AcademicTask } from '@/data/academic-data'
import { currentLateDaysSemester, type LateDaysState } from '@/data/late-days'
import { applyLateDaysPlan, lateDaysBalance, lateDaysStorageKey, parseLateDays, taskDeadline, type LateDaysPlanItem } from '@/lib/late-days'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { homeworkStorageKey, parseHomeworkRecords } from '@/lib/homework-storage'

type LateDaysContext = {
  state: LateDaysState
  balance: ReturnType<typeof lateDaysBalance>
  deadline: (task: AcademicTask | string) => string
  apply: (plan: LateDaysPlanItem[], batchId: string) => { ok: boolean; error?: string }
}
const Context = createContext<LateDaysContext | null>(null)
export function LateDaysProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => {
    try { return parseLateDays(localStorage.getItem(lateDaysStorageKey)) } catch { return parseLateDays(null) }
  })
  const current = useRef(state)
  current.current = state
  useHomeworkRecords()
  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key === lateDaysStorageKey || event.key === null) { const next = parseLateDays(event.newValue); current.current = next; setState(next) }
    }
    window.addEventListener('storage', listener)
    return () => window.removeEventListener('storage', listener)
  }, [])
  function apply(plan: LateDaysPlanItem[], batchId: string) {
    let stored: string | null
    let records: ReturnType<typeof parseHomeworkRecords>
    try { stored = localStorage.getItem(lateDaysStorageKey); records = parseHomeworkRecords(localStorage.getItem(homeworkStorageKey)) }
    catch { return { ok: false, error: 'Не удалось прочитать данные. Проверь доступ к хранилищу браузера.' } }
    const base = stored ? parseLateDays(stored) : current.current
    const result = applyLateDaysPlan(base, plan, batchId, records)
    if (result.error) return { ok: false, error: result.error }
    try { localStorage.setItem(lateDaysStorageKey, JSON.stringify(result.state)) }
    catch { return { ok: false, error: 'Не удалось сохранить перенос. Дни не списаны. Повтори попытку.' } }
    current.current = result.state
    setState(result.state)
    return { ok: true }
  }
  return <Context.Provider value={{ state, balance: lateDaysBalance(state, currentLateDaysSemester), deadline: value => {
    const task = typeof value === 'string' ? academicTasks.find(task => task.id === value) : value
    return task ? taskDeadline(state, task) : ''
  }, apply }}>{children}</Context.Provider>
}
export function useLateDays() {
  const context = useContext(Context)
  if (!context) throw new Error('LateDaysProvider is required')
  return context
}
