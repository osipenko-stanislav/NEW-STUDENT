import type { GenerativePart, MockContext } from '../types/assistant.ts'

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const strings = (value: Record<string, unknown>, keys: string[]) => keys.every(key => typeof value[key] === 'string')
const subject = (value: unknown) => value === 'math' || value === 'python' || value === 'development' || value === 'general'
const courseFilter = (value: unknown) => value === 'all' || subject(value)
const status = (value: unknown) => ['all', 'active', 'new', 'in-progress', 'submitted'].includes(String(value))
const date = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00+03:00`))
const array = (value: unknown, validate: (item: unknown) => boolean) => Array.isArray(value) && value.every(validate)
const assignment = (value: unknown) => record(value) && strings(value, ['id', 'title', 'course', 'dueAt', 'dueLabel', 'description'])
  && subject(value.subject) && ['new', 'in-progress', 'submitted'].includes(String(value.status)) && Number.isFinite(Date.parse(String(value.dueAt)))

export function isMockContext(value: unknown): value is MockContext {
  return record(value) && ['schedule', 'week', 'assignments', 'materials'].includes(String(value.scenario)) && date(value.day) && courseFilter(value.subject) && (value.courseId === undefined || typeof value.courseId === 'string')
}
export function isGenerativePart(value: unknown): value is GenerativePart {
  if (!record(value) || value.version !== 1 || (value.courseId !== undefined && typeof value.courseId !== 'string')) return false
  switch (value.type) {
    case 'late-days': return ['rescue', 'balance', 'history'].includes(String(value.mode)) && typeof value.planId === 'string' && value.planId.length > 0 && ['burning', 'all-one', 'manual', 'distribute'].includes(String(value.strategy))
    case 'schedule': return ['day', 'week'].includes(String(value.mode)) && ['all', 'classes', 'deadlines'].includes(String(value.view))
      && date(value.selectedDay) && array(value.days, day => record(day) && strings(day, ['short', 'label']) && date(day.date))
      && (value.days as { date: string }[]).some(day => day.date === value.selectedDay)
      && array(value.classes, item => record(item) && strings(item, ['id', 'dateLabel', 'startsAt', 'endsAt', 'course', 'format', 'room', 'teacher', 'topic']) && date(item.date) && subject(item.subject))
      && array(value.assignments, assignment)
    case 'assignments': return status(value.filter) && courseFilter(value.subject) && array(value.items, assignment)
    case 'materials': return strings(value, ['query']) && courseFilter(value.subject) && ['all', 'PDF', 'IPYNB', 'MD'].includes(String(value.fileType))
      && array(value.items, item => record(item) && strings(item, ['id', 'title', 'course', 'path', 'description']) && subject(item.subject) && ['PDF', 'IPYNB', 'MD'].includes(String(item.fileType)))
    default: return false
  }
}
