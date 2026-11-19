import { resolveHomeworkAssignment } from '@/lib/study-projections'
import ContinueStudyResponse from './ContinueStudyResponse'
import HomeworkItem from '@/components/homework/HomeworkItem'
import { homeworkStatus } from '@/lib/homework-storage'
import { useLateDays } from '@/components/LateDaysProvider'
import { academicTasks } from '@/data/academic-data'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { navigate } from '@/hooks/use-navigation'
import { useState } from 'react'
import { BookOpenCheck } from 'lucide-react'
import { SemanticIcon } from '@/components/ui/semantic-icon'
import { Button } from '@/components/ui/button'
import AssignmentStatusFilter from '@/components/AssignmentStatusFilter'
import { matchesFilters, singleFilter, type FilterCondition } from '@/lib/filters'
import { assignmentStatusConditions } from '@/lib/study-filters'
import type { AssignmentsPart } from '@/types/assistant'

export default function AssignmentsResponse({ part, onNavigate }: { part: AssignmentsPart; onNavigate: (section: string) => void }) {
  const [conditions, setConditions] = useState<FilterCondition[]>(() => assignmentStatusConditions(part.filter))
  const records = useHomeworkRecords()
  const { deadline } = useLateDays()
  const items = part.items.map(item => resolveHomeworkAssignment(item, records, deadline(item.id) || item.dueAt)).filter(item => (part.subject === 'all' || item.subject === part.subject)
    && matchesFilters({ status: item.personalSkipped ? 'skipped' : item.status }, conditions))
  if (part.presentation === 'continue-study') return <ContinueStudyResponse onNavigate={onNavigate} />
  return <section className="gen-ui" aria-label="Список домашних заданий">
    <div className="gen-header"><h3 className="gen-heading"><SemanticIcon icon={BookOpenCheck} tone="violet" />Домашки</h3><p>Все сроки по Москве</p></div>
    <div className="gen-select-row"><AssignmentStatusFilter conditions={conditions} onChange={setConditions} />
      <span className="sr-only" role="status">Заданий: {items.length}</span>
    </div>
    {items.length ? <ul className="homework-list" aria-label="Задания">
      {items.map(item => {
        const task = academicTasks.find(task => task.id === item.id)
        // Chat snapshots are resolved against current academic entities before rendering.
        return task ? <li key={item.id}><HomeworkItem task={{ ...task, dueAt: item.dueAt, status: homeworkStatus(task, records[task.id]) }}
          disclosure onOpen={() => onNavigate(`Курсы/${task.courseId}/${task.id}`)} /></li> : null
      })}
    </ul> : <p className="gen-empty">Заданий с таким статусом нет</p>}
    <div className="gen-footer"><Button type="button" variant="outline" onClick={() => { const course = part.subject !== 'all' ? `subject:${part.subject}` : new Set(part.items.map(item => item.courseId)).size === 1 ? part.items[0]?.courseId ?? 'all' : 'all'; navigate({ homeworkFilter: 'all', homeworkCourse: course, homeworkConditions: [...conditions, ...singleFilter('course', course)] }, true); onNavigate('Домашки') }}>Открыть домашки</Button></div>
  </section>
}
