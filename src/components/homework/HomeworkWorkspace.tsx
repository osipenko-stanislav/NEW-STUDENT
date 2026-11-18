import { AnimatedStatus } from '@/components/ui/animated-status'
import { GradeValue } from '@/components/ui/grade-value'
import { useLateDays } from '@/components/LateDaysProvider'
import TaskDeadline from '@/components/late-days/TaskDeadline'
import RescueButton from '@/components/late-days/RescueButton'
import { EmptyState } from '@/components/ui/empty-state'
import { navigate, useNavigation } from '@/hooks/use-navigation'
import { BookOpenCheck } from 'lucide-react'
import { academicTasks, enrollments } from '@/data/academic-data'
import { courses } from '@/data/course-catalog'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { isHomeworkSkipped, homeworkStatus } from '@/lib/homework-storage'
import { isHomework, taskStatusLabels, taskStatusVariants } from '@/lib/academic-presentation'
import { homeworkFilterStatus } from '@/lib/homework-filters'
import { formatGrade } from '@/lib/grade-calculation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FilterBuilder } from '@/components/ui/filter-builder'
import { matchesFilters, singleFilter } from '@/lib/filters'
import { assignmentStatusField, assignmentStatusConditions } from '@/lib/study-filters'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import HomeworkModeBadge from '@/components/courses/HomeworkModeBadge'

const tasks = academicTasks.filter(isHomework)
const enrollmentById = new Map(enrollments.map(item => [item.id, item]))
const subjectLabels: Record<string, string> = { math: 'Математика', python: 'Python', development: 'Разработка', general: 'Общие дисциплины' }
const courseNames = new Map(courses.map(course => [course.id, course.title]))
export default function HomeworkWorkspace({ onNavigate }: { onNavigate: (destination: string) => void }) {
  const state = useNavigation()
  const scope = state.homeworkScope ?? 'current'
  const conditions = state.homeworkConditions ?? [...assignmentStatusConditions(state.homeworkFilter), ...singleFilter('course', state.homeworkCourse)]
  const fields = [assignmentStatusField, { id: 'course', label: 'Курс', options: [...courses.map(item => ({ value: item.id, label: item.title })), ...Object.entries(subjectLabels).map(([id, label]) => ({ value: `subject:${id}`, label }))] }]
  const records = useHomeworkRecords()
  const { deadline } = useLateDays()
  const visible = tasks.filter(task => !!enrollmentById.get(task.enrollmentId)?.archived === (scope === 'archive')).map(task => ({ ...task, dueAt: deadline(task), status: homeworkStatus(task, records[task.id]) }))
    .filter(task => matchesFilters({ status: isHomeworkSkipped(task, records[task.id]) ? 'skipped' : homeworkFilterStatus(task.status), course: [task.courseId, `subject:${task.courseId === 'python-basic' ? 'python' : courses.find(item => item.id === task.courseId)?.area}`] }, conditions))
    .sort((a, b) => Number(homeworkFilterStatus(a.status) === 'submitted') - Number(homeworkFilterStatus(b.status) === 'submitted') || a.dueAt.localeCompare(b.dueAt) || a.title.localeCompare(b.title, 'ru'))
  function reset() { navigate({ homeworkScope: scope, homeworkFilter: 'all', homeworkCourse: 'all', homeworkConditions: [] }, true) }
  return <section className="page-container study-page all-homework-page" data-layout="data" aria-label="Домашки">
    <p className="study-page-context">Сроки по Москве</p>
    <Tabs value={scope} onValueChange={value => navigate({ homeworkScope: value as 'current' | 'archive', homeworkConditions: [], homeworkFilter: 'all', homeworkCourse: 'all' }, true)}>
      <TabsList aria-label="Раздел домашних заданий"><TabsTrigger value="current">Текущие</TabsTrigger><TabsTrigger value="archive">Архивные</TabsTrigger></TabsList>
      <TabsContent value={scope} className="homework-list-surface">
      <div className="homework-filters">
        <FilterBuilder fields={fields} conditions={conditions} onChange={homeworkConditions => navigate({ homeworkConditions }, true)} label="Фильтры домашних заданий" />
        {scope === 'current' ? <RescueButton /> : null}
      </div>
      <p className="sr-only" role="status">Заданий: {visible.length}. Сначала несданные, затем сданные.</p>
      {visible.length ? <><div className="homework-table-heading" aria-hidden="true"><span>Задание</span><span>Дедлайн · МСК</span><span>Статус</span><span>Балл</span></div>
        <ul className="homework-all-list" aria-label="Все домашние задания">{visible.map(task => <li key={task.id} className="homework-all-row" data-task-id={task.id}>
          <div className="homework-all-copy"><Button variant="link" className="homework-task-link" onClick={() => onNavigate(`Курсы/${task.courseId}/${task.id}`)}>{task.title}</Button>
            <Button variant="link" className="homework-course-link" onClick={() => { onNavigate(`Курсы/${task.courseId}`); navigate({ courseEnrollmentId: task.enrollmentId, courseTab: scope === 'archive' ? 'homework' : 'course' }, true) }}>{courseNames.get(task.courseId)}</Button><HomeworkModeBadge minutes={task.timeLimitMinutes} /></div>
          <div className="homework-all-deadline"><TaskDeadline task={task} /></div>
          <Badge className="homework-all-status" variant={taskStatusVariants[task.status]}><AnimatedStatus state={task.status} label={taskStatusLabels[task.status]} choices={Object.values(taskStatusLabels)} /></Badge>
          <span className="homework-all-grade" aria-label={`Балл: ${formatGrade(task.grade)}`}><GradeValue value={task.grade} />{task.grade !== null ? <small> / 10</small> : null}</span>
        </li>)}</ul></> : <EmptyState className="study-empty" icon={BookOpenCheck} title="Домашки не найдены" description="Выбери другой курс или статус." action={<Button variant="outline" onClick={reset}>Показать все домашки</Button>} />}
    </TabsContent></Tabs>
  </section>
}
