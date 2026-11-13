import { useHomeworkRecords } from '@/hooks/use-homework'
import { homeworkStatus } from '@/lib/homework-storage'
import { navigate } from '@/hooks/use-navigation'
import { statementForCourse, tasksForCourse } from '@/data/academic-data'
import { formatGrade } from '@/lib/grade-calculation'
import { taskStatusLabels, taskStatusVariants } from '@/lib/academic-presentation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
export default function CourseGradeSummary({ courseId, onOpen }: { courseId: string; onOpen: () => void }) {
  const statement = statementForCourse(courseId)
  const records = useHomeworkRecords()
  return <section className="course-section" aria-label="Краткая ведомость курса"><div className="course-section-toolbar"><div><h2 className="text-base font-semibold">Ведомость по курсу</h2><p className="text-sm text-muted-foreground mt-2">Итоговая оценка: <strong className="text-foreground">{formatGrade(statement.grade)}</strong></p></div><Button type="button" variant="outline" onClick={onOpen}>Открыть полную ведомость</Button></div>
    <ul className="divide-y mt-5">{tasksForCourse(courseId).map(task => ({ ...task, status: homeworkStatus(task, records[task.id]) })).map(task => <li key={task.id} className="course-homework-row"><div className="min-w-0 flex-1 text-sm"><Button variant="link" className="h-auto p-0 whitespace-normal text-left justify-start text-foreground" onClick={() => navigate({ taskId: task.id })}>{task.title}</Button><p className="text-xs text-muted-foreground mt-1">{task.activity}</p></div><Badge variant={taskStatusVariants[task.status]}>{taskStatusLabels[task.status]}</Badge><strong className="text-sm tabular-nums">{formatGrade(task.grade)}</strong></li>)}</ul>
  </section>
}
