import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AssignmentDetails, { assignmentStatuses } from './AssignmentDetails'
import type { AssignmentFilter, AssignmentsPart, DemoAssignment } from '@/types/assistant'

export default function AssignmentsResponse({ part, onNavigate }: { part: AssignmentsPart; onNavigate: (section: string) => void }) {
  const [filter, setFilter] = useState<AssignmentFilter>(part.filter)
  const [assignment, setAssignment] = useState<DemoAssignment | null>(null)
  const id = useId()
  const items = part.items.filter(item => (part.subject === 'all' || item.subject === part.subject)
    && (filter === 'all' || (filter === 'active' ? item.status !== 'submitted' : item.status === filter)))
  return <section className="gen-ui" aria-label="Список домашних заданий">
    <div className="gen-header"><h3>Домашки</h3><p>Демонстрационные задания · Все сроки по Москве</p></div>
    <div className="gen-select-row"><label htmlFor={id}>Статус</label><select id={id} className="gen-select" value={filter} onChange={event => setFilter(event.target.value as AssignmentFilter)}>
      <option value="all">Все</option><option value="active">Не сданы</option><option value="new">Новые</option><option value="in-progress">В процессе</option><option value="submitted">Сданы</option>
    </select><span className="text-xs text-muted-foreground" role="status">Найдено: {items.length}</span></div>
    {items.length ? <ul className="gen-assignment-list" aria-label="Задания">
      {items.map(item => <li key={item.id}><details className="gen-assignment-details">
        <summary><span className="min-w-0 flex-1"><span className="gen-row-title">{item.title}</span><span className="gen-row-meta">{item.course}</span>
          <span className="gen-row-meta"><time dateTime={item.dueAt}>До {item.dueLabel}</time> · {assignmentStatuses[item.status]}</span></span>
          <ChevronDown className="gen-chevron" aria-hidden="true" /></summary>
        <div className="gen-detail"><p>{item.description}</p><div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{assignmentStatuses[item.status]}</Badge>
          <Button type="button" variant="outline" size="sm" onClick={() => setAssignment(item)} aria-label={`Открыть задание: ${item.title}`}>Открыть задание</Button>
        </div></div>
      </details></li>)}
    </ul> : <p className="gen-empty">Заданий с таким статусом нет</p>}
    <div className="gen-footer"><Button type="button" variant="outline" onClick={() => onNavigate('Домашки')}>Открыть домашки</Button></div>
    <AssignmentDetails assignment={assignment} onClose={() => setAssignment(null)} onNavigate={onNavigate} />
  </section>
}
