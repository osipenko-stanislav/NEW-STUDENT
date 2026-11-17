import { DeadlineTransfer } from '@/components/late-days/TaskDeadline'
import { useLateDays } from '@/components/LateDaysProvider'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { Clock3, Video } from 'lucide-react'
import DeadlineLabel from '@/components/DeadlineLabel'
import WidgetPopover from '@/components/WidgetPopover'
import { navigate } from '@/hooks/use-navigation'
import { homeworkDeadlines, upcomingClassSlots } from '@/data/study-widgets'

type StudyWidgetProps = {
  kind: 'next-class' | 'deadlines'
  label: string
  icon: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (destination: string) => void
}

export default function StudyWidget({ kind, label, icon, open, onOpenChange, onNavigate }: StudyWidgetProps) {
  const { formatTime, formatDate } = useDisplayFormats()
  const { deadline } = useLateDays()
  const isClass = kind === 'next-class'
  const title = isClass ? 'Ближайшие пары' : 'Ближайшие дедлайны'
  const action = isClass ? 'Открыть расписание' : 'Открыть домашки'

  return <WidgetPopover open={open} onOpenChange={onOpenChange} title={title}
    action={{ label: action, onClick: () => onNavigate(isClass ? 'Расписание' : 'Домашки') }}
    triggerLabel={label} triggerIcon={icon} triggerClassName={isClass ? 'status-widget-classes' : 'status-widget-deadlines'}
    triggerIconNode={isClass ? <Video className="size-4" aria-hidden="true" /> : <Clock3 className="size-4" aria-hidden="true" />}
    contentClassName={`study-widget-popover ${isClass ? '' : 'study-widget-popover-deadlines'}`}>
    {isClass ? <ul className="study-widget-list" aria-label="Ближайшие пары">
      {upcomingClassSlots.map(slot => <li key={slot.id}><button type="button" className="preview-popover-row study-class-row" onClick={() => { onOpenChange(false); onNavigate('Расписание'); navigate({ scheduleDate: slot.date, scheduleEventId: slot.id, scheduleKind: 'classes', scheduleCourse: 'all', scheduleFormat: 'all', scheduleRoom: 'all', scheduleTeacher: 'all' }, true) }}>
        <span className="study-class-time">
          <time dateTime={`${slot.date}T${slot.startsAt}:00+03:00`}>{formatTime(slot.startsAt)}</time>
          <time className="study-class-end" dateTime={`${slot.date}T${slot.endsAt}:00+03:00`}>
            <span className="sr-only">Окончание: </span>{formatTime(slot.endsAt)}
          </time>
        </span>
        <span className="study-row-content">
          <span className="study-row-title">{slot.course}</span>
          <span className="study-row-meta">
            <time dateTime={slot.date}>{formatDate(slot.date, true)}</time>
            <span className="study-class-format">{slot.format}</span>
          </span>
        </span>
      </button></li>)}
    </ul> : <ul className="study-widget-list" aria-label="Ближайшие домашки">
      {homeworkDeadlines.map(homework => <li key={homework.id} className="deadline-preview-row"><button type="button" className="preview-popover-row study-homework-row" onClick={() => { onOpenChange(false); onNavigate(`Курсы/${homework.courseId}/${homework.id}`) }}>
        <span className="study-row-title">{homework.title}</span>
        <span className="study-row-meta study-homework-meta">
          <span>{homework.course}</span>
          <DeadlineLabel dueAt={deadline(homework.id) || homework.dueAt} status={homework.status} />
        </span>
      </button><DeadlineTransfer taskId={homework.id} /></li>)}
    </ul>}
  </WidgetPopover>
}
