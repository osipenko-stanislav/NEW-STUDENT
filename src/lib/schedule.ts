import type { DemoClass } from '../types/assistant.ts';

export type ScheduleView = 'week' | 'day' | 'two-days' | 'list'
type CalendarEntry = { id: string; startsAt: string; endsAt: string }
export function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + amount)
  return value.toISOString().slice(0, 10)
}
export function weekDays(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay()
  const monday = addDays(date, -((day + 6) % 7))
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}
export function moscowDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
export function minutesAt(time: string) { const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes }
export function classTone(format: string) { return format === 'Лекция' ? 'violet' : format === 'Семинар' ? 'amber' : format === 'Практика' ? 'blue' : 'slate' }
export function scheduleRangeLabel(start: string, end: string) {
  const date = (value: string) => new Date(`${value}T12:00:00+03:00`)
  const format = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' })
  return start === end ? format.format(date(start)) : `${format.format(date(start))} – ${format.format(date(end))}`
}
export function filterClasses(classes: DemoClass[], filters: { course: string; format: string; room: string; teacher: string }) {
  return classes.filter(slot => (filters.course === 'all' || slot.courseId === filters.course)
    && (filters.format === 'all' || slot.format === filters.format) && (filters.room === 'all' || slot.room === filters.room)
    && (filters.teacher === 'all' || slot.teacher === filters.teacher))
}

// Connected overlaps share lanes, so a long event cannot obscure shorter events.
export function layoutCalendarEntries<T extends CalendarEntry>(entries: T[]) {
  const sorted = [...entries].sort((a, b) => minutesAt(a.startsAt) - minutesAt(b.startsAt) || minutesAt(a.endsAt) - minutesAt(b.endsAt) || a.id.localeCompare(b.id))
  const output: { entry: T; lane: number; lanes: number }[] = []
  let group: { entry: T; lane: number }[] = [], ends: number[] = [], groupEnd = -1
  function flush() { const lanes = ends.length; output.push(...group.map(item => ({ ...item, lanes }))); group = []; ends = []; groupEnd = -1 }
  for (const entry of sorted) {
    const start = minutesAt(entry.startsAt), end = minutesAt(entry.endsAt)
    if (group.length && start >= groupEnd) flush()
    let lane = ends.findIndex(value => value <= start)
    if (lane < 0) lane = ends.length
    ends[lane] = end
    group.push({ entry, lane }); groupEnd = Math.max(groupEnd, end)
  }
  flush()
  return output
}
