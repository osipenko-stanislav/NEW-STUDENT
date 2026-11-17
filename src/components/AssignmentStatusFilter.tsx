import { FilterBuilder } from '@/components/ui/filter-builder'
import type { FilterCondition } from '@/lib/filters'
import { assignmentStatusField } from '@/lib/study-filters'

export default function AssignmentStatusFilter({ conditions, onChange, className }: { conditions: FilterCondition[]; onChange: (conditions: FilterCondition[]) => void; className?: string }) {
  return <FilterBuilder fields={[assignmentStatusField]} conditions={conditions} onChange={onChange} className={className} label="Фильтры домашних заданий" />
}
