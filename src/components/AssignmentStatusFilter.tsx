import { useId } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { homeworkFilterOptions } from '@/lib/homework-filters'
import type { AssignmentFilter } from '@/types/assistant';

export default function AssignmentStatusFilter({ value, onChange, className }: { value: AssignmentFilter; onChange: (value: AssignmentFilter) => void; className?: string }) {
  const id = useId()
  return <div className="assignment-status-filter">
    <label htmlFor={id}>Статус</label>
    <Select value={value} onValueChange={next => onChange(next as AssignmentFilter)}>
      <SelectTrigger id={id} className={className}><SelectValue /></SelectTrigger>
      <SelectContent>{homeworkFilterOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
  </div>
}
