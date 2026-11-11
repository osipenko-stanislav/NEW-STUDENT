import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { DemoAssignment } from '@/types/assistant'

export const assignmentStatuses = { new: 'Новое', 'in-progress': 'В процессе', submitted: 'Сдано' } as const

export default function AssignmentDetails({ assignment, onClose, onNavigate }: {
  assignment: DemoAssignment | null; onClose: () => void; onNavigate: (section: string) => void
}) {
  return <Dialog open={!!assignment} onOpenChange={open => { if (!open) onClose() }}>
    {assignment ? <DialogContent className="conversation-action-dialog">
      <DialogHeader className="pr-6 text-left">
        <DialogTitle className="break-words [overflow-wrap:anywhere]">{assignment.title}</DialogTitle>
        <DialogDescription>{assignment.course} · Демонстрационное задание</DialogDescription>
      </DialogHeader>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary">{assignmentStatuses[assignment.status]}</Badge>
        <time dateTime={assignment.dueAt}>До {assignment.dueLabel} МСК</time>
      </div>
      <p className="text-sm leading-6">{assignment.description}</p>
      <DialogFooter><Button type="button" variant="outline" onClick={() => { onClose(); onNavigate('Домашки') }}>Открыть домашки</Button></DialogFooter>
    </DialogContent> : null}
  </Dialog>
}
