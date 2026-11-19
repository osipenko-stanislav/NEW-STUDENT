import { ChevronDown } from 'lucide-react'
import type { AcademicTask } from '@/data/academic-data'
import { getCourse } from '@/data/course-catalog'
import { taskStatusLabels, taskStatusVariants } from '@/lib/academic-presentation'
import { homeworkFilterStatus } from '@/lib/homework-filters'
import { formatGrade } from '@/lib/grade-calculation'
import DeadlineLabel from '@/components/DeadlineLabel'
import { DeadlineTransfer } from '@/components/late-days/TaskDeadline'
import { HomeworkPersonalStatus } from '@/components/courses/HomeworkPersonalControl'
import HomeworkModeBadge from '@/components/courses/HomeworkModeBadge'
import { AnimatedStatus } from '@/components/ui/animated-status'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GradeValue } from '@/components/ui/grade-value'

type HomeworkItemProps = {
  /** The owning feature resolves the current academic status and effective deadline. */
  task: AcademicTask
  onOpen: (taskId: string) => void
  onOpenCourse?: () => void
  showGrade?: boolean
  disclosure?: boolean
}

/** A homework entity, independent of the list, route or surface that contains it. */
export default function HomeworkItem({ task, onOpen, onOpenCourse, showGrade = false, disclosure = false }: HomeworkItemProps) {
  const course = getCourse(task.courseId).title
  const identity = <span className="homework-item-identity">
    {disclosure ? <span className="homework-item-title"><span>{task.title}</span><ChevronDown className="homework-item-chevron" aria-hidden="true" /></span>
      : <Button type="button" variant="link" className="homework-item-title" onClick={() => onOpen(task.id)}>{task.title}</Button>}
    {!disclosure && onOpenCourse ? <Button type="button" variant="link" className="homework-item-course" onClick={onOpenCourse}>{course}</Button> : <span className="homework-item-course">{course}</span>}
    <span className="homework-item-mode"><HomeworkModeBadge minutes={task.timeLimitMinutes} /></span>
  </span>
  const facts = <span className="homework-item-facts">
    <span className="homework-item-deadline"><DeadlineLabel dueAt={task.dueAt} status={homeworkFilterStatus(task.status)} /></span>
    <span className="homework-item-status"><Badge variant={taskStatusVariants[task.status]} data-status={task.status}><AnimatedStatus state={task.status} label={taskStatusLabels[task.status]} /></Badge><HomeworkPersonalStatus taskId={task.id} /></span>
    {showGrade ? <span className="homework-item-grade" aria-label={`Балл: ${formatGrade(task.grade)}`}><span className="homework-item-grade-label" aria-hidden="true">Балл</span><span><GradeValue value={task.grade} />{task.grade !== null ? <small> / 10</small> : null}</span></span> : null}
  </span>
  return <article className="homework-item" data-task-id={task.id} data-grade={showGrade || undefined} aria-label={`Задание: ${task.title}`}>
    <div className="homework-item-layout">
      {disclosure ? <details className="homework-item-disclosure">
        <summary className="homework-item-grid">{identity}{facts}</summary>
        <div className="homework-item-detail"><p>{task.description}</p><Button type="button" variant="outline" size="sm" onClick={() => onOpen(task.id)} aria-label={`Открыть задание: ${task.title}`}>Открыть задание</Button></div>
      </details> : <div className="homework-item-grid">{identity}{facts}</div>}
      <div className="homework-item-actions" role="group" aria-label={`Действия с заданием: ${task.title}`}><DeadlineTransfer taskId={task.id} /></div>
    </div>
  </article>
}

/** Uses the same column geometry as the items; compact layouts carry their own labels. */
export function HomeworkListHeading({ showGrade = false }: { showGrade?: boolean }) {
  return <div className="homework-list-heading" data-grade={showGrade || undefined} aria-hidden="true"><div className="homework-item-layout"><div className="homework-item-grid"><span>Задание</span><span>Дедлайн · МСК</span><span>Статус</span>{showGrade ? <span className="homework-item-grade-heading">Балл</span> : null}</div><span /></div></div>
}
