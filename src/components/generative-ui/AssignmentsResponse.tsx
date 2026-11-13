import HomeworkModeBadge from '@/components/courses/HomeworkModeBadge'
import { academicTasks } from '@/data/academic-data'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { navigate } from '@/hooks/use-navigation'
import { useState } from 'react'
import { BookOpenCheck, ChevronDown } from 'lucide-react'
import { SemanticIcon } from '@/components/ui/semantic-icon'
import DeadlineLabel from '@/components/DeadlineLabel'
import { Button } from '@/components/ui/button'
import AssignmentStatusFilter from '@/components/AssignmentStatusFilter'
import { matchesHomeworkFilter } from '@/lib/homework-filters'
import { AssignmentStatusBadge } from './AssignmentDetails'
import type { AssignmentFilter, AssignmentsPart } from '@/types/assistant'

export default function AssignmentsResponse({ part, onNavigate }: { part: AssignmentsPart; onNavigate: (section: string) => void }) {
  const [filter, setFilter] = useState<AssignmentFilter>(part.filter)
  const records = useHomeworkRecords()
  const items = part.items.map(item => ({ ...item, status: records[item.id]?.submittedAt ? 'submitted' as const : records[item.id]?.savedAt || records[item.id]?.startedAt ? 'in-progress' as const : item.status })).filter(item => (part.subject === 'all' || item.subject === part.subject)
    && matchesHomeworkFilter(item.status, filter))
  return <section className="gen-ui" aria-label="Список домашних заданий">
    <div className="gen-header"><h3 className="gen-heading"><SemanticIcon icon={BookOpenCheck} tone="violet" />Домашки</h3><p>Все сроки по Москве</p></div>
    <div className="gen-select-row"><AssignmentStatusFilter value={filter} onChange={setFilter} className="gen-status-select" />
      <span className="sr-only" role="status">Заданий: {items.length}</span>
    </div>
    {items.length ? <ul className="gen-assignment-list" aria-label="Задания">
      {items.slice(0, 5).map(item => <li key={item.id}><details className="gen-assignment-details">
        <summary><span className="gen-assignment-copy"><span className="min-w-0"><span className="gen-row-title">{item.title}</span><span className="gen-row-meta">{item.course}</span></span>
          <span className="gen-assignment-meta"><HomeworkModeBadge minutes={academicTasks.find(task => task.id === item.id)?.timeLimitMinutes} /><DeadlineLabel dueAt={item.dueAt} status={item.status} prefix="До " /><AssignmentStatusBadge status={item.status} /></span></span>
          <ChevronDown className="gen-chevron" aria-hidden="true" /></summary>
        <div className="gen-detail"><p>{item.description}</p><div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onNavigate(`Курсы/${item.courseId}/${item.id}`)} aria-label={`Открыть задание: ${item.title}`}>Открыть задание</Button>
        </div></div>
      </details></li>)}
    </ul> : <p className="gen-empty">Заданий с таким статусом нет</p>}
    <div className="gen-footer"><Button type="button" variant="outline" onClick={() => { navigate({ homeworkFilter: filter, homeworkCourse: part.subject !== 'all' ? `subject:${part.subject}` : new Set(part.items.map(item => item.courseId)).size === 1 ? part.items[0]?.courseId ?? 'all' : 'all' }, true); onNavigate('Домашки') }}>Открыть домашки</Button></div>
  </section>
}
