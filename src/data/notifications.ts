import { academicClasses, academicMaterials, academicTasks } from './academic-data.ts'

export type NotificationCategory = 'learning' | 'events' | 'goals'
export type NotificationFilter = 'all' | NotificationCategory | 'important'
export type NotificationTarget = { kind: 'task'; id: string } | { kind: 'material'; id: string } | { kind: 'class'; id: string } | { kind: 'course'; id: string }
export type StudentNotification = {
  id: string
  type: 'reviewed' | 'deadline' | 'material' | 'class' | 'course'
  category: NotificationCategory
  important: boolean
  createdAt: string
  target: NotificationTarget
}
const currentTasks = academicTasks.filter(task => task.enrollmentId === `current-${task.courseId}`)
const accepted = currentTasks.filter(task => task.status === 'accepted').filter((task, index, tasks) => tasks.findIndex(item => item.courseId === task.courseId) === index)
const active = currentTasks.filter(task => task.grade === null)

// Only event metadata lives here. Course names, grades, deadlines and destinations
// are resolved from the shared academic model when the event is displayed.
export function createNotifications(anchor: number): StudentNotification[] {
  const definitions: Array<Omit<StudentNotification, 'id' | 'createdAt'> & { minutes: number }> = [
    { type: 'reviewed', category: 'learning', target: { kind: 'task', id: accepted[0].id }, important: false, minutes: 8 },
    { type: 'deadline', category: 'learning', target: { kind: 'task', id: active[0].id }, important: true, minutes: 35 },
    { type: 'material', category: 'learning', target: { kind: 'material', id: academicMaterials[0].id }, important: false, minutes: 90 },
    { type: 'class', category: 'events', target: { kind: 'class', id: academicClasses[0].id }, important: true, minutes: 160 },
    { type: 'reviewed', category: 'learning', target: { kind: 'task', id: accepted[1].id }, important: false, minutes: 260 },
    { type: 'material', category: 'learning', target: { kind: 'material', id: academicMaterials[1].id }, important: false, minutes: 430 },
    { type: 'deadline', category: 'learning', target: { kind: 'task', id: active[1].id }, important: true, minutes: 1440 },
    { type: 'course', category: 'learning', target: { kind: 'course', id: 'databases' }, important: false, minutes: 1520 },
    { type: 'class', category: 'events', target: { kind: 'class', id: academicClasses[2].id }, important: false, minutes: 1680 },
    { type: 'reviewed', category: 'learning', target: { kind: 'task', id: accepted[2].id }, important: false, minutes: 1840 },
    { type: 'material', category: 'learning', target: { kind: 'material', id: academicMaterials[2].id }, important: false, minutes: 2880 },
    { type: 'deadline', category: 'learning', target: { kind: 'task', id: active[2].id }, important: true, minutes: 3100 },
    { type: 'class', category: 'events', target: { kind: 'class', id: academicClasses[4].id }, important: false, minutes: 4320 },
    { type: 'material', category: 'learning', target: { kind: 'material', id: academicMaterials[3].id }, important: false, minutes: 4560 },
    { type: 'reviewed', category: 'learning', target: { kind: 'task', id: accepted[3].id }, important: false, minutes: 5760 },
    { type: 'course', category: 'learning', target: { kind: 'course', id: 'python-basic' }, important: false, minutes: 6100 },
    { type: 'material', category: 'learning', target: { kind: 'material', id: academicMaterials[4].id }, important: false, minutes: 7200 },
    { type: 'class', category: 'events', target: { kind: 'class', id: academicClasses[5].id }, important: false, minutes: 8640 },
  ]
  return definitions.map(({ minutes, ...event }, index) => ({ ...event, id: `notification-${index + 1}`, createdAt: new Date(anchor - minutes * 60_000).toISOString() }))
}
export const notificationFilters: Array<{ value: NotificationFilter; label: string }> = [
  { value: 'all', label: 'Все' }, { value: 'learning', label: 'Обучение' }, { value: 'events', label: 'События' }, { value: 'goals', label: 'Цели' }, { value: 'important', label: 'Важное' },
]
