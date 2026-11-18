import { CircleSlash } from 'lucide-react'
import { academicTasks } from '@/data/academic-data'
import { canSkipHomework, isHomeworkSkipped } from '@/lib/homework-storage'
import { setHomeworkSkipped, useHomeworkRecords } from '@/hooks/use-homework'
import { actionStatus } from '@/lib/action-status'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { StateIcon } from '@/components/ui/state-icon'

export function HomeworkPersonalStatus({ taskId }: { taskId: string }) {
  const records = useHomeworkRecords()
  const task = academicTasks.find(task => task.id === taskId)
  return task && isHomeworkSkipped(task, records[taskId]) ? <Badge variant="neutral" className="homework-personal-label">Пропущено мной</Badge> : null
}
export default function HomeworkPersonalControl({ taskId }: { taskId: string }) {
  const records = useHomeworkRecords()
  const task = academicTasks.find(task => task.id === taskId)
  if (!task || !canSkipHomework(task, records[taskId])) return null
  const skipped = isHomeworkSkipped(task, records[taskId])
  const label = skipped ? 'Вернуть в план' : 'Не буду выполнять'
  function change() {
    const saved = setHomeworkSkipped(taskId, !skipped)
    actionStatus.report({ key: `homework-plan:${taskId}`, label: saved ? skipped ? 'Задание возвращено в план' : 'Пропущено мной' : 'Не удалось изменить личный план',
      detail: saved ? skipped ? task!.title : 'Задание останется в курсе и календаре, но не в личном плане. Оценка и срок не изменены. Отсутствие сдачи может повлиять на итоговую оценку.' : 'Повтори попытку. Проверь свободное место в браузере.' }, saved)
  }
  return <span className="homework-personal-control" data-personal-skipped={skipped || undefined} data-homework-personal={taskId}>
    <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="homework-skip-action" aria-pressed={skipped}
      aria-label={`${label}: ${task.title}`} title={skipped ? 'Пропущено мной · Вернуть в план' : label}
      onClick={event => { event.stopPropagation(); change() }}>
      <StateIcon state={skipped ? 'skipped' : 'planned'}><CircleSlash aria-hidden="true" fill={skipped ? 'currentColor' : 'none'} fillOpacity={skipped ? .12 : 0} /></StateIcon>
    </Button></TooltipTrigger><TooltipContent>{skipped ? 'Пропущено мной · Вернуть в план' : label}</TooltipContent></Tooltip>
  </span>
}
