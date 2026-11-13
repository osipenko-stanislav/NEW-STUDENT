import { Clock3, TriangleAlert } from 'lucide-react'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { isAssignmentOverdue } from '@/lib/assignment-presentation'
import type { AssignmentStatus } from '@/types/assistant';

export default function DeadlineLabel({ dueAt, status, prefix = '', timeOnly = false, includeZone = false }: { dueAt: string; status: AssignmentStatus; prefix?: string; timeOnly?: boolean; includeZone?: boolean }) {
  const { formatTime, formatDateTime } = useDisplayFormats()
  const overdue = isAssignmentOverdue(dueAt, status)
  const Icon = overdue ? TriangleAlert : Clock3
  return <span className="semantic-tone deadline-label" data-tone={overdue ? 'red' : status === 'submitted' ? 'slate' : 'amber'}>
    <Icon className="size-3.5 shrink-0" aria-hidden="true" />
    <span><time dateTime={dueAt}>{prefix}{timeOnly ? formatTime(dueAt) : formatDateTime(dueAt, true)}{includeZone ? ' МСК' : ''}</time>{overdue ? <span className="block">Просрочено</span> : null}</span>
  </span>
}
