import { AnimatedStatus } from '@/components/ui/animated-status'
import { GradeValue } from '@/components/ui/grade-value'
import TaskDeadline from '@/components/late-days/TaskDeadline'
import HomeworkModeBadge from './HomeworkModeBadge'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { homeworkStatus } from '@/lib/homework-storage'
import { useId, useState } from 'react'
import { tasksForCourse, type AcademicTask } from '@/data/academic-data'
import { isHomework, taskStatusLabels, taskStatusVariants } from '@/lib/academic-presentation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
export default function CourseHomeworks({ courseId, onOpen }: { courseId: string; onOpen: (id: string) => void }) {
  const [status, setStatus] = useState('all')
  const id = useId()
  const records = useHomeworkRecords()
  const tasks = tasksForCourse(courseId).filter(isHomework).map(task => ({ ...task, status: homeworkStatus(task, records[task.id]) }))
  const visible = tasks.filter(task => status === 'all' || task.status === status)
  return <section className="course-section" aria-label="Домашки курса">
    <div className="course-section-toolbar"><div className="flex items-center gap-3"><label htmlFor={id} className="text-sm">Статус</label><Select value={status} onValueChange={setStatus}><SelectTrigger id={id} className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Все статусы</SelectItem>{(Object.keys(taskStatusLabels) as AcademicTask['status'][]).map(value => <SelectItem key={value} value={value}>{taskStatusLabels[value]}</SelectItem>)}</SelectContent></Select></div></div>
    <p className="sr-only" role="status">Заданий: {visible.length}</p>
    <ul className="divide-y">{visible.map(task => <li key={task.id} className="course-homework-row"><div className="min-w-0 flex-1"><Button type="button" variant="link" className="h-auto p-0 whitespace-normal text-left justify-start text-foreground" onClick={() => onOpen(task.id)}>{task.title}</Button><div className="flex flex-wrap items-center gap-2 mt-2"><HomeworkModeBadge minutes={task.timeLimitMinutes} /><TaskDeadline task={task} /></div></div><Badge variant={taskStatusVariants[task.status]}><AnimatedStatus state={task.status} label={taskStatusLabels[task.status]} choices={Object.values(taskStatusLabels)} /></Badge><span className="font-medium tabular-nums"><GradeValue value={task.grade} /></span></li>)}</ul>
    {!visible.length ? <div className="py-10 text-center"><p className="text-sm text-muted-foreground">Заданий с таким статусом нет.</p><Button className="mt-3" variant="outline" onClick={() => setStatus('all')}>Показать все домашки</Button></div> : null}
  </section>
}
