import { singleFilter, type FilterCondition, type FilterField } from './filters.ts'
import type { AssignmentFilter } from '../types/assistant.ts'
import { homeworkFilterOptions } from './homework-filters.ts'
export const assignmentStatusField: FilterField = {
  id: 'status', label: 'Статус', options: homeworkFilterOptions.filter(item => item.value !== 'all' && item.value !== 'active').map(item => ({ value: item.value, label: item.label })),
}
export function assignmentStatusConditions(status: AssignmentFilter): FilterCondition[] {
  return status === 'active' ? [{ id: 'preset-status', field: 'status', operator: 'any-of', values: ['new', 'in-progress'] }] : singleFilter('status', status)
}
