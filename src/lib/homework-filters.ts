import type { AcademicTask } from '../data/academic-data.ts'
import type { AssignmentFilter, AssignmentStatus } from '../types/assistant.ts'

export const homeworkFilterOptions = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Не\u00a0сданы' },
  { value: 'skipped', label: 'Пропущено мной' },
  { value: 'new', label: 'Новые' },
  { value: 'in-progress', label: 'В\u00a0процессе' },
  { value: 'submitted', label: 'Сданы' },
] as const

// Reviewed work is also submitted. Rejected work needs another attempt.
export function homeworkFilterStatus(status: AcademicTask['status']): AssignmentStatus {
  return status === 'accepted' ? 'submitted' : status === 'rejected' ? 'in-progress' : status
}
export function matchesHomeworkFilter(status: AcademicTask['status'], filter: AssignmentFilter, skipped = false) {
  const projected = homeworkFilterStatus(status)
  return filter === 'all' || (filter === 'skipped' ? skipped : !skipped && (filter === 'active' ? projected !== 'submitted' : projected === filter))
}
