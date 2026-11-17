import { DeadlineTransfer } from '@/components/late-days/TaskDeadline'
import { useEffect, useState } from 'react'
import { CalendarDays, Clock3 } from 'lucide-react'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { PreviewPopoverContent } from '@/components/ui/preview-popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { academicClasses, academicTasks } from '@/data/academic-data'
import { courses } from '@/data/course-catalog'
import { useLateDays } from '@/components/LateDaysProvider'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { navigate } from '@/hooks/use-navigation'
import { homeworkStatus } from '@/lib/homework-storage'
import { isHomework } from '@/lib/academic-presentation'
import { moscowDate } from '@/lib/schedule'
import { upcomingTodayEvents, type SchedulePreviewEvent } from '@/lib/schedule-preview'

const tasks = academicTasks.filter(task => task.enrollmentId === `current-${task.courseId}` && isHomework(task))
const courseNames = new Map(courses.map(course => [course.id, course.title]))
const unfiltered = { scheduleCourse: 'all', scheduleFormat: 'all', scheduleRoom: 'all', scheduleTeacher: 'all' }

export default function SchedulePopover({ onNavigate }: { onNavigate: (destination: string) => void }) {
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const { formatTime, formatDate } = useDisplayFormats()
  const { deadline } = useLateDays()
  const records = useHomeworkRecords()
  useEffect(() => {
    if (!open) return
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [open])
  const today = moscowDate(now)
  const events = upcomingTodayEvents(academicClasses, tasks.map(task => ({ ...task, dueAt: deadline(task), status: homeworkStatus(task, records[task.id]) })), now)
  function openSchedule(event?: SchedulePreviewEvent) {
    setOpen(false)
    if (event?.kind === 'deadline') { onNavigate(`Курсы/${event.courseId}/${event.id}`); return }
    onNavigate('Расписание')
    navigate({ ...unfiltered, scheduleDate: today, scheduleView: 'day', scheduleKind: 'all', scheduleEventId: event?.id ?? null }, true)
  }
  return <Popover open={open} onOpenChange={value => { if (value) setNow(new Date()); setOpen(value) }}>
    <Tooltip><TooltipTrigger asChild><PopoverTrigger asChild>
      <Button type="button" variant="ghost" size="icon" className="ghost-icon" aria-label="Расписание">
        <img src={`${import.meta.env.BASE_URL}assets/figma/calendar-lined1.svg`} alt="" aria-hidden="true" className="design-icon" />
      </Button>
    </PopoverTrigger></TooltipTrigger><TooltipContent>Расписание</TooltipContent></Tooltip>
    <PreviewPopoverContent title="Расписание" meta={`Сегодня, ${formatDate(today, true)}`} action={{ label: 'Открыть расписание', onClick: () => openSchedule() }}>
      {events.length ? <ul className="study-widget-list" aria-label="Ближайшие события на сегодня">{events.map(event => <li key={`${event.kind}-${event.id}`} className={event.kind === 'deadline' ? 'deadline-preview-row' : undefined}>
        <button type="button" className="preview-popover-row study-class-row" onClick={() => openSchedule(event)}>
          <span className="study-class-time"><time dateTime={event.at}>{formatTime(event.at)}</time>
            {event.endsAt ? <span className="study-class-end">до {formatTime(event.endsAt)}</span> : <Clock3 className="size-4 study-class-end" aria-label="Дедлайн" />}</span>
          <span className="study-row-content"><span className="study-row-title">{event.title}</span>
            <span className="study-row-meta">{event.kind === 'deadline' ? `Дедлайн · ${courseNames.get(event.courseId)}` : event.detail}</span>
          </span>
        </button>{event.kind === 'deadline' ? <DeadlineTransfer taskId={event.id} /> : null}
      </li>)}</ul> : <div className="preview-popover-empty"><CalendarDays aria-hidden="true" /><p>На сегодня больше нет занятий и дедлайнов</p></div>}
    </PreviewPopoverContent>
  </Popover>
}
