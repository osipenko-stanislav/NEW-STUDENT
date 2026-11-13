import { AnimatedStatus } from '@/components/ui/animated-status'
import { GradeValue } from '@/components/ui/grade-value'
import { useLateDays } from '@/components/LateDaysProvider'
import TaskDeadline from '@/components/late-days/TaskDeadline'
import RescueButton from '@/components/late-days/RescueButton'
import { EmptyState } from '@/components/ui/empty-state'
import { navigate, useNavigation } from '@/hooks/use-navigation'
import { BookOpenCheck } from 'lucide-react'
import { academicTasks } from '@/data/academic-data'
import { courses } from '@/data/course-catalog'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { homeworkStatus } from '@/lib/homework-storage'
import { isHomework, taskStatusLabels, taskStatusVariants } from '@/lib/academic-presentation'
import { homeworkFilterStatus, matchesHomeworkFilter } from '@/lib/homework-filters'
import { formatGrade } from '@/lib/grade-calculation'
import type { AssignmentFilter } from '@/types/assistant'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AssignmentStatusFilter from '@/components/AssignmentStatusFilter'
import HomeworkModeBadge from '@/components/courses/HomeworkModeBadge'

const tasks = academicTasks.filter(task => task.enrollmentId === `current-${task.courseId}` && isHomework(task))
const subjectLabels: Record<string, string> = { math: 'Математика', python: 'Python', development: 'Разработка', general: 'Общие дисциплины' }
const courseNames = new Map(courses.map(course => [course.id, course.title]))
export default function HomeworkWorkspace({ onNavigate }: { onNavigate: (destination: string) => void }) {
  const { homeworkFilter: filter, homeworkCourse: course } = useNavigation()
  const setFilter = (homeworkFilter: AssignmentFilter) => navigate({ homeworkFilter }, true)
  const setCourse = (homeworkCourse: string) => navigate({ homeworkCourse }, true)
  const records = useHomeworkRecords()
  const { deadline } = useLateDays()
  const visible = tasks.map(task => ({ ...task, dueAt: deadline(task), status: homeworkStatus(task, records[task.id]) }))
    .filter(task => matchesHomeworkFilter(task.status, filter) && (course === 'all' || (course.startsWith('subject:') ? (task.courseId === 'python-basic' ? 'python' : courses.find(item => item.id === task.courseId)?.area) === course.slice(8) : task.courseId === course)))
    .sort((a, b) => Number(homeworkFilterStatus(a.status) === 'submitted') - Number(homeworkFilterStatus(b.status) === 'submitted') || a.dueAt.localeCompare(b.dueAt) || a.title.localeCompare(b.title, 'ru'))
  const filtered = filter !== 'all' || course !== 'all'
  function reset() { navigate({ homeworkFilter: 'all', homeworkCourse: 'all' }, true) }
  return <section className="page-container study-page all-homework-page" data-layout="data" aria-label="Домашки">
    <p className="study-page-context">Сроки по Москве</p>
    <section className="homework-list-surface">
      <div className="homework-filters">
        <div className="homework-course-filter"><label htmlFor="homework-course-filter">Курс</label><Select value={course} onValueChange={setCourse}><SelectTrigger id="homework-course-filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Все курсы</SelectItem>{course.startsWith('subject:') ? <SelectItem value={course}>{subjectLabels[course.slice(8)]}</SelectItem> : null}{courses.map(item => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select></div>
        <AssignmentStatusFilter value={filter} onChange={setFilter} />
        <RescueButton />
        {filtered ? <Button variant="ghost" onClick={reset} className="homework-reset">Сбросить фильтры</Button> : null}
      </div>
      <p className="sr-only" role="status">Заданий: {visible.length}. Сначала несданные, затем сданные.</p>
      {visible.length ? <><div className="homework-table-heading" aria-hidden="true"><span>Задание</span><span>Дедлайн · МСК</span><span>Статус</span><span>Балл</span></div>
        <ul className="homework-all-list" aria-label="Все домашние задания">{visible.map(task => <li key={task.id} className="homework-all-row" data-task-id={task.id}>
          <div className="homework-all-copy"><Button variant="link" className="homework-task-link" onClick={() => onNavigate(`Курсы/${task.courseId}/${task.id}`)}>{task.title}</Button>
            <Button variant="link" className="homework-course-link" onClick={() => onNavigate(`Курсы/${task.courseId}`)}>{courseNames.get(task.courseId)}</Button><HomeworkModeBadge minutes={task.timeLimitMinutes} /></div>
          <div className="homework-all-deadline"><TaskDeadline task={task} /></div>
          <Badge className="homework-all-status" variant={taskStatusVariants[task.status]}><AnimatedStatus state={task.status} label={taskStatusLabels[task.status]} choices={Object.values(taskStatusLabels)} /></Badge>
          <span className="homework-all-grade" aria-label={`Балл: ${formatGrade(task.grade)}`}><GradeValue value={task.grade} />{task.grade !== null ? <small> / 10</small> : null}</span>
        </li>)}</ul></> : <EmptyState className="study-empty" icon={BookOpenCheck} title="Домашки не найдены" description="Выбери другой курс или статус." action={<Button variant="outline" onClick={reset}>Показать все домашки</Button>} />}
    </section>
  </section>
}
