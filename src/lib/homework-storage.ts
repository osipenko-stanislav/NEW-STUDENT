import type { AcademicTask } from '../data/academic-data.ts'
export type HomeworkFile = { id: string; name: string; size: number; type: string }
type HomeworkEvent = { id: string; at: number; text: string }
type HomeworkComment = { id: string; at: number; text: string }
export type HomeworkRecord = {
  link: string; files: HomeworkFile[]; savedAt?: number; startedAt?: number; submittedAt?: number
  events: HomeworkEvent[]; comments: HomeworkComment[]
}
export const homeworkStorageKey = 'student-homework:v1'
export const emptyHomework = (): HomeworkRecord => ({ link: '', files: [], events: [], comments: [] })
export function parseHomeworkRecords(raw: string | null): Record<string, HomeworkRecord> {
  if (!raw) return {}
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return Object.fromEntries(Object.entries(value).filter(([, item]) => {
      if (!item || typeof item !== 'object') return false
      const r = item as HomeworkRecord
      const validTime = (time: unknown) => time === undefined || typeof time === 'number' && Number.isFinite(time) && time > 0
      return typeof r.link === 'string' && validSolutionLink(r.link) && Array.isArray(r.files) && r.files.every(file => file && typeof file.id === 'string' && typeof file.name === 'string' && typeof file.type === 'string' && Number.isFinite(file.size) && file.size >= 0)
        && [r.savedAt, r.startedAt, r.submittedAt].every(validTime)
        && [r.events, r.comments].every(list => Array.isArray(list) && list.every(event => event && typeof event.id === 'string' && typeof event.text === 'string' && typeof event.at === 'number' && Number.isFinite(event.at) && event.at > 0))
    }))
  } catch { return {} }
}
export function homeworkStatus(task: AcademicTask, record?: HomeworkRecord): AcademicTask['status'] {
  if (task.status === 'accepted') return task.status
  return record?.submittedAt ? 'submitted' : record?.savedAt || record?.startedAt ? 'in-progress' : task.status
}
export function remainingHomeworkTime(record: HomeworkRecord, minutes: number, now = Date.now()) {
  return record.startedAt ? Math.max(0, record.startedAt + minutes * 60000 - now) : minutes * 60000
}
export function validSolutionLink(link: string) {
  if (!link.trim()) return true
  try { return ['http:', 'https:'].includes(new URL(link.trim()).protocol) } catch { return false }
}
