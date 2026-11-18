import { gradeStatements, type AcademicTask } from '../data/academic-data.ts'
import { getCourse } from '../data/course-catalog.ts'
import { lateDaysPolicy, type LateDaysState } from '../data/late-days.ts'
import { taskDeadline } from './late-days.ts'
import { isHomeworkSkipped, homeworkStatus, type HomeworkRecord } from './homework-storage.ts'

// Uses only coursework state; no inferred viewing history or reading progress.
export function continueStudyActions(tasks: readonly AcademicTask[], records: Readonly<Record<string, HomeworkRecord>>, state: LateDaysState) {
  return tasks.flatMap(task => {
    const status = homeworkStatus(task, records[task.id])
    if (isHomeworkSkipped(task, records[task.id]) || !task.enrollmentId.startsWith('current-') || task.grade !== null || (status !== 'new' && status !== 'in-progress')) return []
    const dueAt = taskDeadline(state, task)
    const deadline = Date.parse(dueAt)
    const activity = gradeStatements.find(statement => statement.id === task.enrollmentId)?.formula?.find(row => row.id === task.activityId)
    const weight = activity?.weight ?? 0
    return [{ task, status, dueAt: Number.isFinite(deadline) ? dueAt : null, deadline: Number.isFinite(deadline) ? deadline : Infinity, weight,
      required: getCourse(task.courseId).category === 'required' }]
  }).sort((a, b) => a.deadline - b.deadline || b.weight - a.weight || Number(b.required) - Number(a.required)
    || Number(b.status === 'in-progress') - Number(a.status === 'in-progress') || a.task.id.localeCompare(b.task.id)).slice(0, 3)
}
export function continueStudyReason(action: ReturnType<typeof continueStudyActions>[number]) {
  if (action.deadline < lateDaysPolicy.now) return 'Срок этой работы уже прошел. Предлагаю сначала открыть ее и проверить доступные действия.'
  if (action.dueAt) return 'У этой несданной работы один из ближайших сроков. Предлагаю начать с нее.'
  return action.status === 'in-progress' ? 'Работа уже начата и еще не отправлена. Срок не указан.' : 'Эта работа еще не выполнена. Срок не указан.'
}
