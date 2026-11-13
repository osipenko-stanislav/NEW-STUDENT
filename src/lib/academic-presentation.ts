import type { AcademicTask } from '../data/academic-data.ts'
export const taskStatusLabels: Record<AcademicTask['status'], string> = {
  new: 'Не начато', 'in-progress': 'В процессе', submitted: 'На проверке', accepted: 'Сдано', rejected: 'Отклонено',
}
export const taskStatusVariants = { new: 'neutral', 'in-progress': 'active', submitted: 'active', accepted: 'success', rejected: 'danger' } as const
export function isHomework(task: AcademicTask) { return /домашн/i.test(task.activity) }
