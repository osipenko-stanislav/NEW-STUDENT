import { useState } from 'react'
import { academicTasks, type AcademicTask } from '@/data/academic-data'
import { useLateDays } from '@/components/LateDaysProvider'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { homeworkFilterStatus } from '@/lib/homework-filters'
import { homeworkStatus } from '@/lib/homework-storage'
import { lateDaysReason, taskDays } from '@/lib/late-days'
import DeadlineLabel from '@/components/DeadlineLabel'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import LateDaysDialog from './LateDaysDialog'
export default function TaskDeadline({ task, timeOnly = false, prefix = '' }: { task: AcademicTask; timeOnly?: boolean; prefix?: string }) {
  const original = academicTasks.find(item => item.id === task.id) ?? task
  const { state, deadline } = useLateDays()
  const records = useHomeworkRecords()
  const [open, setOpen] = useState(false)
  const reason = lateDaysReason(original, state, records)
  const days = taskDays(state, task.id)
  return <div className="task-deadline"><DeadlineLabel dueAt={deadline(original)} status={homeworkFilterStatus(homeworkStatus(original, records[task.id]))} timeOnly={timeOnly} prefix={prefix} />
    <span className="task-deadline-actions">{days > 0 ? <span className="late-days-applied">+{days} дн.</span> : null}
      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="late-days-task-action" aria-label={`Перенести дедлайн: ${task.title}`} aria-disabled={!!reason} onClick={() => { if (!reason) setOpen(true) }}><img src={`${import.meta.env.BASE_URL}assets/figma/calendar-plus01-lined1.svg`} alt="" aria-hidden="true" className="design-icon" /></Button></TooltipTrigger><TooltipContent className="max-w-64">{reason ?? 'Перенести дедлайн с помощью Late Days'}</TooltipContent></Tooltip>
    </span>{open ? <LateDaysDialog taskId={task.id} onClose={() => setOpen(false)} /> : null}
  </div>
}
