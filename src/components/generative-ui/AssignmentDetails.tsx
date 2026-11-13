import { Badge } from '@/components/ui/badge'
import { Circle, CircleDashed, Clock3 } from 'lucide-react'
import { assignmentStatuses, assignmentVariants } from '@/lib/assignment-presentation'
import type { AssignmentStatus } from '@/types/assistant'

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const Icon = status === 'submitted' ? Clock3 : status === 'in-progress' ? CircleDashed : Circle
  return <Badge variant={assignmentVariants[status]} className="gen-status" data-status={status}><Icon aria-hidden="true" />{assignmentStatuses[status]}</Badge>
}
