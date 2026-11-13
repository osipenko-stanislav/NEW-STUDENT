import { academicTasks } from './academic-data.ts'
import { demoToday } from './study-seed.ts'
import { isHomework } from '../lib/academic-presentation.ts';

export type LateDaysSemester = { id: string; name: string; startsAt: string; endsAt: string; limit: number; current: boolean; grants: { days: number; at: string }[] }
export type LateDaysOperation = {
  id: string; batchId: string; semesterId: string; taskId: string; type: 'debit' | 'refund' | 'adjustment'; days: number; at: string
  originalDeadline: string; beforeDeadline: string; newDeadline: string; status: 'applied'
}
export type LateDaysState = { version: 1; operations: LateDaysOperation[] }
// UX-demo policy, not an official university regulation. The clock shares the
// existing fixed academic week; timers for solving tasks still use real time.
export const lateDaysPolicy = {
  now: Date.parse(`${demoToday}T12:00:00+03:00`), dayMs: 86400000, burningHours: 48,
  preserveTime: true, rounding: 'whole-calendar-days', allowStudentRefund: false,
  allowOverdue: false, allowStartedTimedTasks: false, timeZone: 'Europe/Moscow',
} as const
export const lateDaysSemesters: LateDaysSemester[] = [
  { id: 'autumn-2026', name: 'Осень 2026', startsAt: '2026-09-01', endsAt: '2027-01-31', limit: 24, current: true, grants: [] },
  { id: 'spring-2026', name: 'Весна 2026', startsAt: '2026-02-01', endsAt: '2026-06-30', limit: 20, current: false, grants: [{ days: 2, at: '2026-03-01T12:00:00+03:00' }] },
  { id: 'autumn-2025', name: 'Осень 2025', startsAt: '2025-09-01', endsAt: '2026-01-31', limit: 18, current: false, grants: [] },
]
export const currentLateDaysSemester = lateDaysSemesters.find(item => item.current)!
export function shiftDeadline(value: string, days: number) {
  return `${new Date(Date.parse(value) + days * lateDaysPolicy.dayMs + 3 * 3600000).toISOString().slice(0, 19)}+03:00`
}
export function seedLateDays(): LateDaysState {
  const eligible = academicTasks.filter(task => task.enrollmentId.startsWith('current-') && task.status === 'accepted' && isHomework(task))
    .filter((task, index, all) => all.findIndex(item => item.courseId === task.courseId) === index)
  const archive = academicTasks.filter(task => task.enrollmentId.startsWith('archive-') && isHomework(task))
  const operations: LateDaysOperation[] = []
  function operation(task: typeof academicTasks[number], semesterId: string, days: number, at: string, type: LateDaysOperation['type'] = 'debit') {
    const beforeDeadline = operations.filter(item => item.taskId === task.id).at(-1)?.newDeadline ?? task.dueAt
    const id = `late-days-seed-${operations.length + 1}`
    operations.push({ id, batchId: id, semesterId, taskId: task.id, type, days, at, originalDeadline: task.dueAt, beforeDeadline, newDeadline: shiftDeadline(beforeDeadline, type === 'refund' ? -days : days), status: 'applied' })
  }
  operation(eligible[0], 'autumn-2026', 2, '2026-09-15T14:00:00+03:00')
  operation(eligible[1], 'autumn-2026', 4, '2026-10-10T11:00:00+03:00')
  operation(eligible[2], 'autumn-2026', 3, '2026-11-05T16:00:00+03:00')
  operation(archive[0], 'spring-2026', 3, '2026-02-18T12:00:00+03:00')
  operation(archive[1], 'spring-2026', 5, '2026-03-15T12:00:00+03:00')
  operation(archive[1], 'spring-2026', 1, '2026-03-16T12:00:00+03:00', 'refund')
  return { version: 1, operations }
}
