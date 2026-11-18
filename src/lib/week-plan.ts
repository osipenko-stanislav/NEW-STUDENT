import type { DemoAssignment, DemoClass } from '../types/assistant.ts'
export type PersonalStudyBlock = { id: string; week: string; taskId: string; day: string; minutes: number; done: boolean }
export const weekPlanStorageKey = 'student-week-plan:v1'
export function parseWeekPlan(raw: string | null): PersonalStudyBlock[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (data?.version !== 1 || !Array.isArray(data.blocks)) return []
    const ids = new Set<string>()
    return data.blocks.filter((block: PersonalStudyBlock) => {
      const valid = block && typeof block.id === 'string' && block.id.length > 0 && !ids.has(block.id) && typeof block.taskId === 'string'
        && [block.week, block.day].every(date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)))
        && [30, 60, 90, 120].includes(block.minutes) && typeof block.done === 'boolean'
      if (valid) ids.add(block.id)
      return valid
    })
  } catch { return [] }
}
const minutes = (time: string) => { const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes }
const clock = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
export function dayStudyLoad(day: string, classes: readonly DemoClass[], assignments: readonly DemoAssignment[], blocks: readonly PersonalStudyBlock[]) {
  const intervals = classes.filter(slot => slot.date === day).map(slot => [minutes(slot.startsAt), minutes(slot.endsAt)])
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && end > start).sort((a, b) => a[0] - b[0])
  const merged: number[][] = []
  for (const interval of intervals) {
    const previous = merged.at(-1)
    if (previous && previous[1] >= interval[0]) previous[1] = Math.max(previous[1], interval[1])
    else merged.push([...interval])
  }
  const classMinutes = merged.reduce((sum, [start, end]) => sum + end - start, 0)
  const personalMinutes = blocks.filter(block => block.day === day && !block.done && !assignments.some(task => task.id === block.taskId && task.personalSkipped)).reduce((sum, block) => sum + block.minutes, 0)
  const deadlines = assignments.filter(task => task.status !== 'submitted' && !task.personalSkipped && task.dueAt.startsWith(day)).length
  const windows = merged.slice(1).flatMap(([start], index) => start - merged[index][1] >= 30 ? [{ start: clock(merged[index][1]), end: clock(start), minutes: start - merged[index][1] }] : [])
  const overloaded = deadlines >= 3 || classMinutes + personalMinutes >= 360 || deadlines >= 2 && classMinutes + personalMinutes >= 180
  const intensity = overloaded ? 'high' : deadlines || classMinutes + personalMinutes >= 180 ? 'medium' : 'low'
  return { day, classMinutes, personalMinutes, deadlines, windows, overloaded, intensity }
}
