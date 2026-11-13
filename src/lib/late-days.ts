import { academicTasks, enrollments, type AcademicTask } from '../data/academic-data.ts'
import { currentLateDaysSemester, lateDaysPolicy, lateDaysSemesters, seedLateDays, shiftDeadline, type LateDaysSemester, type LateDaysState, type LateDaysOperation } from '../data/late-days.ts'
import { homeworkStatus, type HomeworkRecord } from './homework-storage.ts'
import { isHomework } from './academic-presentation.ts'
export const lateDaysStorageKey = 'student-late-days:v1'
export type LateDaysPlanItem = { taskId: string; days: number; expectedDeadline: string }
const operationCost = (operation: LateDaysOperation) => operation.type === 'refund' ? -operation.days : operation.days
export function semesterForTask(task: AcademicTask) {
  const enrollment = enrollments.find(item => item.id === task.enrollmentId)
  return enrollment?.semester == null ? undefined : lateDaysSemesters.find(item => item.id === (enrollment.archived ? 'spring-2026' : currentLateDaysSemester.id))
}
export function taskDeadline(state: LateDaysState, task: AcademicTask) {
  return state.operations.filter(item => item.taskId === task.id && item.status === 'applied').at(-1)?.newDeadline ?? task.dueAt
}
export function taskDays(state: LateDaysState, taskId: string) { return state.operations.filter(item => item.taskId === taskId).reduce((sum, item) => sum + operationCost(item), 0) }
export function lateDaysBalance(state: LateDaysState, semester: LateDaysSemester = currentLateDaysSemester, at = lateDaysPolicy.now) {
  const limit = semester.limit + semester.grants.filter(item => Date.parse(item.at) <= at).reduce((sum, item) => sum + item.days, 0)
  const used = state.operations.filter(item => item.semesterId === semester.id && item.status === 'applied' && Date.parse(item.at) <= at).reduce((sum, item) => sum + operationCost(item), 0)
  return { limit, used, remaining: limit - used }
}
export function lateDaysReason(task: AcademicTask, state: LateDaysState, records: Record<string, HomeworkRecord>, now = lateDaysPolicy.now): string | null {
  const semester = semesterForTask(task)
  if (!semester) return 'Для этого курса Late Days не предусмотрены.'
  if (!semester.current) return 'Архивный семестр доступен только для просмотра.'
  if (!isHomework(task)) return 'Late Days доступны только для домашних работ.'
  const status = homeworkStatus(task, records[task.id])
  if (status === 'submitted' || status === 'accepted') return 'Сданное задание нельзя переносить.'
  if (!lateDaysPolicy.allowStartedTimedTasks && task.timeLimitMinutes && records[task.id]?.startedAt) return 'Таймер уже запущен. Дедлайн нельзя изменить.'
  if (!lateDaysPolicy.allowOverdue && Date.parse(taskDeadline(state, task)) < now) return 'Срок изменения дедлайна уже прошёл.'
  if (taskDeadline(state, task).slice(0, 10) >= semester.endsAt) return 'Дедлайн достиг конца семестра. Продление недоступно.'
  if (lateDaysBalance(state, semester, now).remaining < 1) return 'В этом семестре закончились Late Days.'
  return null
}
export function burningTasks(state: LateDaysState, records: Record<string, HomeworkRecord>, now = lateDaysPolicy.now) {
  return academicTasks.filter(task => !lateDaysReason(task, state, records, now) && Date.parse(taskDeadline(state, task)) >= now && Date.parse(taskDeadline(state, task)) <= now + lateDaysPolicy.burningHours * 3600000)
    .sort((a, b) => taskDeadline(state, a).localeCompare(taskDeadline(state, b)) || a.id.localeCompare(b.id))
}
export function applyLateDaysPlan(state: LateDaysState, plan: LateDaysPlanItem[], batchId: string, records: Record<string, HomeworkRecord>, now = lateDaysPolicy.now): { state: LateDaysState; error?: string } {
  if (state.operations.some(item => item.batchId === batchId)) return { state }
  if (!batchId || !plan.length || new Set(plan.map(item => item.taskId)).size !== plan.length) return { state, error: 'Выбери задания для переноса.' }
  for (const item of plan) {
    const task = academicTasks.find(task => task.id === item.taskId)
    if (!task) return { state, error: 'Задание больше не доступно.' }
    const reason = lateDaysReason(task, state, records, now)
    if (reason) return { state, error: reason }
    if (!Number.isSafeInteger(item.days) || item.days < 1 || item.days > 366) return { state, error: 'Укажи целое количество дней от 1 до 366.' }
    if (Date.parse(taskDeadline(state, task)) !== Date.parse(item.expectedDeadline)) return { state, error: 'Дедлайн уже изменился. Обнови план и проверь его ещё раз.' }
    if (shiftDeadline(item.expectedDeadline, item.days).slice(0, 10) > semesterForTask(task)!.endsAt) return { state, error: 'Новый дедлайн выходит за пределы семестра.' }
  }
  const cost = plan.reduce((sum, item) => sum + item.days, 0)
  if (cost > lateDaysBalance(state, currentLateDaysSemester, now).remaining) return { state, error: 'Не хватает Late Days. Уменьши количество дней или выбери меньше заданий.' }
  const operations: LateDaysOperation[] = plan.map((item, index) => {
    const task = academicTasks.find(task => task.id === item.taskId)!
    return { id: `${batchId}-${index}`, batchId, semesterId: semesterForTask(task)!.id, taskId: task.id, type: 'debit', days: item.days, at: new Date(now).toISOString(), originalDeadline: task.dueAt, beforeDeadline: taskDeadline(state, task), newDeadline: shiftDeadline(taskDeadline(state, task), item.days), status: 'applied' }
  })
  return { state: { version: 1, operations: [...state.operations, ...operations] } }
}
export function parseLateDays(raw: string | null): LateDaysState {
  if (!raw) return seedLateDays()
  try {
    const data = JSON.parse(raw)
    if (data?.version !== 1 || !Array.isArray(data.operations)) return seedLateDays()
    const result: LateDaysState = { version: 1, operations: [] }
    const ids = new Set<string>()
    for (const item of data.operations) {
      const task = academicTasks.find(task => task.id === item?.taskId)
      const semester = lateDaysSemesters.find(semester => semester.id === item?.semesterId)
      if (!task || !semester || semesterForTask(task)?.id !== semester.id || !['debit', 'refund', 'adjustment'].includes(item.type) || !Number.isSafeInteger(item.days) || item.days === 0 || item.type !== 'adjustment' && item.days < 0 || item.status !== 'applied' || typeof item.id !== 'string' || !item.id || ids.has(item.id) || typeof item.batchId !== 'string' || !item.batchId || !Number.isFinite(Date.parse(item.at)) || ![item.originalDeadline, item.beforeDeadline, item.newDeadline].every(value => typeof value === 'string' && Number.isFinite(Date.parse(value)))) return seedLateDays()
      if (item.originalDeadline !== task.dueAt || Date.parse(item.beforeDeadline) !== Date.parse(taskDeadline(result, task)) || Date.parse(item.newDeadline) !== Date.parse(shiftDeadline(item.beforeDeadline, operationCost(item)))) return seedLateDays()
      ids.add(item.id); result.operations.push(item)
      const balance = lateDaysBalance(result, semester, Date.parse(item.at))
      if (balance.remaining < 0 || balance.used < 0) return seedLateDays()
    }
    return result
  } catch { return seedLateDays() }
}
export function lateDaysMonths(state: LateDaysState, semester: LateDaysSemester, now = lateDaysPolicy.now) {
  const months: { id: string; label: string; limit: number; used: number; remaining: number }[] = []
  let month = semester.startsAt.slice(0, 7)
  const end = Math.min(Date.parse(`${semester.endsAt}T23:59:59+03:00`), now)
  while (Date.parse(`${month}-01T00:00:00+03:00`) <= end) {
    const start = new Date(`${month}-01T00:00:00Z`)
    const next = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))
    const until = Math.min(next.getTime() - 3 * 3600000 - 1, end)
    months.push({ id: month, label: new Intl.DateTimeFormat('ru', { month: 'short', timeZone: 'UTC' }).format(start).replace('.', ''), ...lateDaysBalance(state, semester, until) })
    month = next.toISOString().slice(0, 7)
  }
  return months
}
