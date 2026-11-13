import { academicClasses, academicMaterials, academicTasks } from '../data/academic-data.ts'
import { courses } from '../data/course-catalog.ts'
import { createNotifications, type StudentNotification, type NotificationFilter } from '../data/notifications.ts'
import type { NavigationState } from '../hooks/use-navigation.ts'

export const notificationStorageKey = 'student-notifications:v1'
export function initialNotifications(now: number) {
  return { anchor: now, readIds: createNotifications(now).slice(7).map(event => event.id) }
}
export function parseNotificationState(raw: string | null, now: number) {
  if (!raw) return initialNotifications(now)
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.version !== 1 || !Number.isFinite(parsed.anchor) || parsed.anchor <= 0 || parsed.anchor > now + 60_000 || !Array.isArray(parsed.readIds)) return initialNotifications(now)
    const ids = new Set(createNotifications(parsed.anchor).map(event => event.id))
    return { anchor: parsed.anchor as number, readIds: [...new Set<string>(parsed.readIds.filter((id: unknown): id is string => typeof id === 'string' && ids.has(id)))] }
  } catch { return initialNotifications(now) }
}
export function notificationDetails(event: StudentNotification, deadline?: (id: string) => string): { title: string; description: string; source: string; destination: Partial<NavigationState> } | null {
  const target = event.target
  const clean: Partial<NavigationState> = { courseId: null, taskId: null, lessonId: null, materialId: null, statementId: null, studyTarget: undefined, courseTab: 'course' }
  if (target.kind === 'task') {
    const task = academicTasks.find(item => item.id === target.id)
    if (!task) return null
    const course = courses.find(item => item.id === task.courseId)!
    const reviewed = event.type === 'reviewed'
    return { title: reviewed ? 'Домашняя работа проверена' : 'Напоминание о сдаче',
      description: reviewed ? `${task.title}. Оценка: ${task.grade ?? '—'}.` : `${task.title}. Срок сдачи: ${new Intl.DateTimeFormat('ru', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(deadline?.(task.id) || task.dueAt))} МСК.`, source: course.title,
      destination: { ...clean, section: 'Курсы', courseId: course.id, taskId: task.id, courseTab: 'homework' } }
  }
  if (target.kind === 'material') {
    const material = academicMaterials.find(item => item.id === target.id)
    if (!material) return null
    return { title: 'Опубликован учебный материал', description: material.title, source: material.course,
      destination: { ...clean, section: 'Курсы', courseId: material.courseId, materialId: material.id, courseTab: 'materials' } }
  }
  if (target.kind === 'class') {
    const slot = academicClasses.find(item => item.id === target.id)
    if (!slot) return null
    return { title: event.important ? 'Обновлено расписание занятия' : 'Занятие появилось в расписании', description: slot.topic, source: slot.course,
      destination: { ...clean, section: 'Расписание', scheduleDate: slot.date, scheduleView: 'day', scheduleEventId: slot.id, scheduleKind: 'classes', scheduleCourse: 'all', scheduleFormat: 'all', scheduleRoom: 'all', scheduleTeacher: 'all' } }
  }
  const course = courses.find(item => item.id === target.id)
  return course ? { title: 'Обновлена программа курса', description: 'Посмотри темы и учебные материалы курса.', source: course.title, destination: { ...clean, section: 'Курсы', courseId: course.id } } : null
}
export function filterNotifications(events: StudentNotification[], readIds: ReadonlySet<string>, category: NotificationFilter, unreadOnly: boolean) {
  return events.filter(event => (category === 'all' || (category === 'important' ? event.important : event.category === category)) && (!unreadOnly || !readIds.has(event.id)))
}
const relative = new Intl.RelativeTimeFormat('ru', { numeric: 'auto', style: 'short' })
export function notificationRelativeTime(createdAt: string, now: number) {
  const minutes = Math.max(0, Math.floor((now - Date.parse(createdAt)) / 60_000))
  if (minutes < 1) return 'Только что'
  if (minutes < 60) return relative.format(-minutes, 'minute')
  if (minutes < 1440) return relative.format(-Math.floor(minutes / 60), 'hour')
  return relative.format(-Math.floor(minutes / 1440), 'day')
}
export function notificationDay(date: string) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date)) }
export function notificationGroupLabel(date: string, now: number) {
  const day = notificationDay(date)
  if (day === notificationDay(new Date(now).toISOString())) return 'Сегодня'
  if (day === notificationDay(new Date(now - 86400000).toISOString())) return 'Вчера'
  return new Intl.DateTimeFormat('ru', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long' }).format(new Date(date))
}
