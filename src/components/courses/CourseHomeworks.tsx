import HomeworkItem from '@/components/homework/HomeworkItem'
import { useLateDays } from '@/components/LateDaysProvider'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { isHomeworkSkipped, homeworkStatus } from '@/lib/homework-storage'
import { useState } from 'react'
import { tasksForCourse, type AcademicTask } from '@/data/academic-data'
import { isHomework, taskStatusLabels } from '@/lib/academic-presentation'
import { Button } from '@/components/ui/button'
import { FilterBuilder } from '@/components/ui/filter-builder'
import { matchesFilters, type FilterCondition } from '@/lib/filters'
export default function CourseHomeworks({ courseId, enrollmentId, onOpen }: { courseId: string; enrollmentId?: string; onOpen: (id: string) => void }) {
  const [conditions, setConditions] = useState<FilterCondition[]>([])
  const records = useHomeworkRecords()
  const { deadline } = useLateDays()
  const tasks = tasksForCourse(courseId, enrollmentId).filter(isHomework).map(task => ({ ...task, status: homeworkStatus(task, records[task.id]), dueAt: deadline(task) }))
  const visible = tasks.filter(task => matchesFilters({ status: isHomeworkSkipped(task, records[task.id]) ? 'skipped' : task.status }, conditions))
  return <section className="course-section" aria-label="Домашки курса">
    <div className="course-section-toolbar"><FilterBuilder fields={[{ id: 'status', label: 'Статус', options: [{ value: 'skipped', label: 'Пропущено мной' }, ...(Object.keys(taskStatusLabels) as AcademicTask['status'][]).map(value => ({ value, label: taskStatusLabels[value] }))] }]} conditions={conditions} onChange={setConditions} label="Фильтры домашних заданий курса" /></div>
    <p className="sr-only" role="status">Заданий: {visible.length}</p>
    <ul className="homework-list">{visible.map(task => <li key={task.id}><HomeworkItem task={task} onOpen={onOpen} showGrade /></li>)}</ul>
    {!visible.length ? <div className="py-10 text-center"><p className="text-sm text-muted-foreground">Заданий с таким статусом нет.</p><Button className="mt-3" variant="outline" onClick={() => setConditions([])}>Показать все домашки</Button></div> : null}
  </section>
}
