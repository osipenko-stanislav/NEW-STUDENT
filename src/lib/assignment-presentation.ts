import { demoToday } from '../data/study-demo.ts'
import type { AssignmentStatus } from '../types/assistant.ts'

export const assignmentStatuses = { new: 'Новое', 'in-progress': 'В процессе', submitted: 'На проверке' } as const
export const assignmentVariants = { new: 'neutral', 'in-progress': 'active', submitted: 'active' } as const

// Keep restored answers consistent with the prototype's fixed demonstration week.
export function isAssignmentOverdue(dueAt: string, status: AssignmentStatus): boolean {
  return status !== 'submitted' && Date.parse(dueAt) < Date.parse(`${demoToday}T00:00:00+03:00`)
}
