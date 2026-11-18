import { useSyncExternalStore } from 'react'
import type { CourseFilter } from '@/data/course-catalog'
import type { FilterCondition } from '@/lib/filters'

export type NavigationState = {
  homeworkScope?: 'current' | 'archive'
  courseCatalogFilter?: CourseFilter | 'archive'
  courseEnrollmentId?: string | null
  homeworkConditions?: FilterCondition[]
  scheduleConditions?: FilterCondition[]
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
  homeworkScope: 'current', courseCatalogFilter: 'all', courseEnrollmentId: null,
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
function navigationFromUrl(): Partial<NavigationState> {
  const params = new URL(window.location.href).searchParams
  const section = params.get('section')
  const courseId = params.get('course')
  const taskId = params.get('task')
  const lessonId = params.get('lesson')
  const statementId = params.get('statement')
  const courseTab = params.get('tab')
  return {
    ...(section ? { section } : {}), ...(courseId ? { courseId, studyTarget: courseId } : {}),
    ...(taskId ? { taskId } : {}), ...(lessonId ? { lessonId } : {}),
    ...(statementId ? { statementId, studyTarget: statementId } : {}),
    ...(courseTab ? { courseTab } : {}),
  }
}
let current: NavigationState = { ...initial, ...window.history.state?.[key], ...navigationFromUrl(), ...handbookFromUrl() }
window.history.replaceState({ ...window.history.state, [key]: current }, '')
const listeners = new Set<() => void>()
function emit() { listeners.forEach(listener => listener()) }
window.addEventListener('popstate', () => {
  current = { ...initial, ...window.history.state?.[key], ...handbookFromUrl() }
  emit()
})
export function navigate(patch: Partial<NavigationState>, replace = false) {
  const next = { ...current, ...patch }
  if ('courseId' in patch && !('courseEnrollmentId' in patch)) next.courseEnrollmentId = null
  if (!('homeworkScope' in patch) && ('homeworkFilter' in patch || 'homeworkCourse' in patch)) next.homeworkScope = 'current'
  // Legacy destinations from search, notifications and AI replace prior predicates.
  if (!('homeworkConditions' in patch) && ('homeworkFilter' in patch || 'homeworkCourse' in patch)) next.homeworkConditions = undefined
  if (!('scheduleConditions' in patch) && ['scheduleCourse', 'scheduleFormat', 'scheduleRoom', 'scheduleTeacher'].some(key => key in patch)) next.scheduleConditions = undefined
  if (JSON.stringify(next) === JSON.stringify(current)) return
  const url = new URL(window.location.href)
  if (next.section !== 'Хэндбук') {
    for (const name of ['section', 'course', 'task', 'lesson', 'statement', 'tab']) url.searchParams.delete(name)
    if (next.section) url.searchParams.set('section', next.section)
    if (next.courseId) url.searchParams.set('course', next.courseId)
    if (next.taskId) url.searchParams.set('task', next.taskId)
    if (next.lessonId) url.searchParams.set('lesson', next.lessonId)
    if (next.statementId) url.searchParams.set('statement', next.statementId)
    if (next.courseId && next.courseTab !== 'course') url.searchParams.set('tab', next.courseTab)
  }
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
