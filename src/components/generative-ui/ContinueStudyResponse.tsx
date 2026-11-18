import HomeworkPersonalControl from '@/components/courses/HomeworkPersonalControl'
import { ArrowRight, BookOpenCheck } from 'lucide-react'
import { academicTasks } from '@/data/academic-data'
import { getCourse } from '@/data/course-catalog'
import { continueStudyActions, continueStudyReason } from '@/lib/continue-study'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { useLateDays } from '@/components/LateDaysProvider'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SemanticIcon } from '@/components/ui/semantic-icon'
import DeadlineLabel from '@/components/DeadlineLabel'
import { AssignmentStatusBadge } from './AssignmentDetails'

export default function ContinueStudyResponse({ onNavigate }: { onNavigate: (section: string) => void }) {
  const records = useHomeworkRecords()
  const { state } = useLateDays()
  const [primary, ...alternatives] = continueStudyActions(academicTasks, records, state)
  if (!primary) return <section className="gen-ui" aria-label="Продолжить учёбу"><EmptyState icon={BookOpenCheck} title="Нет заданий, которые можно продолжить" description="Открой курс, чтобы выбрать учебные материалы." action={<Button variant="outline" onClick={() => onNavigate('Курсы')}>Открыть курсы</Button>} /></section>
  const open = (action: typeof primary) => onNavigate(`Курсы/${action.task.courseId}/${action.task.id}`)
  return <section className="gen-ui gen-continue" aria-label="Продолжить учёбу">
    <div className="gen-header"><h3 className="gen-heading"><SemanticIcon icon={BookOpenCheck} tone="violet" />{primary.task.title}</h3><p>{getCourse(primary.task.courseId).title}</p></div>
    <div className="gen-continue-context"><AssignmentStatusBadge status={primary.status} />{primary.dueAt ? <DeadlineLabel dueAt={primary.dueAt} status={primary.status} prefix="До " includeZone /> : null}</div>
    <HomeworkPersonalControl taskId={primary.task.id} /><p className="gen-continue-reason">{continueStudyReason(primary)}</p>
    <Button type="button" onClick={() => open(primary)}>Продолжить<ArrowRight aria-hidden="true" /></Button>
    {alternatives.length ? <div className="gen-continue-alternatives"><p>Или выбери другую работу</p><ul>{alternatives.map(action => <li key={action.task.id}><Button type="button" variant="link" onClick={() => open(action)}>{action.task.title}<ArrowRight aria-hidden="true" /></Button><span className="gen-row-meta">{getCourse(action.task.courseId).title}</span>{action.dueAt ? <DeadlineLabel dueAt={action.dueAt} status={action.status} prefix="До " /> : null}<HomeworkPersonalControl taskId={action.task.id} /></li>)}</ul></div> : null}
  </section>
}
