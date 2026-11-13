import { useSyncExternalStore } from 'react'

export type NavigationState = {
  section: string
  handbookPageId: string | null
  handbookAnchor: string | null
  studyTarget?: string
  materialId: string | null
  courseId: string | null
  taskId: string | null
  lessonId: string | null
  originBlockId: string
  courseTab: string
  statementId: string | null
  gradeTab: string
  scheduleEventId: string | null
  scheduleDate: string | null
  scheduleView: 'week' | 'day' | 'two-days' | 'list' | null
  scheduleKind: 'all' | 'classes' | 'deadlines'
  scheduleCourse: string
  scheduleFormat: string
  scheduleRoom: string
  scheduleTeacher: string
  homeworkFilter: 'all' | 'active' | 'new' | 'in-progress' | 'submitted'
  homeworkCourse: string
  conversationId: string | null
}
const initial: NavigationState = {
  materialId: null, handbookPageId: null, handbookAnchor: null,
  scheduleEventId: null, scheduleDate: null, scheduleView: null, scheduleKind: 'all', scheduleCourse: 'all', scheduleFormat: 'all', scheduleRoom: 'all', scheduleTeacher: 'all',
  homeworkFilter: 'all', homeworkCourse: 'all',
  section: 'Навигатор', courseId: null, taskId: null, lessonId: null, originBlockId: 'block-1',
  courseTab: 'course', statementId: null, gradeTab: 'formula', conversationId: null,
}
const key = 'studentNavigation'
function handbookFromUrl() {
  const id = new URL(window.location.href).searchParams.get('handbook')
  return id ? { section: 'Хэндбук', handbookPageId: id, handbookAnchor: decodeURIComponent(window.location.hash.slice(1)) || null } : {}
}
let current: NavigationState = { ...initial, ...window.history.state?.[key], ...handbookFromUrl() }
window.history.replaceState({ ...window.history.state, [key]: current }, '')
const listeners = new Set<() => void>()
function emit() { listeners.forEach(listener => listener()) }
window.addEventListener('popstate', () => {
  current = { ...initial, ...window.history.state?.[key], ...handbookFromUrl() }
  emit()
})
export function navigate(patch: Partial<NavigationState>, replace = false) {
  const next = { ...current, ...patch }
  if (JSON.stringify(next) === JSON.stringify(current)) return
  const url = new URL(window.location.href)
  if (next.section === 'Хэндбук') {
    url.searchParams.set('handbook', next.handbookPageId ?? 'db3f475e-b70a-4423-abc0-b030db55c80b')
    url.hash = next.handbookAnchor ?? ''
  } else if (current.section === 'Хэндбук') {
    url.searchParams.delete('handbook')
    url.hash = ''
  }
  window.history[replace ? 'replaceState' : 'pushState']({ ...window.history.state, [key]: next }, '', url)
  current = next
  emit()
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export function useNavigation() {
  return useSyncExternalStore(subscribe, () => current)
}
