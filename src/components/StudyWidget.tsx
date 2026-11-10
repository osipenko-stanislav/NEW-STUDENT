import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import WidgetPopover from '@/components/WidgetPopover'
import { homeworkDeadlines, upcomingClassSlots } from '@/data/study-widgets'

type StudyWidgetProps = {
  kind: 'next-class' | 'deadlines'
  label: string
  icon: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: () => void
}

export default function StudyWidget({ kind, label, icon, open, onOpenChange, onNavigate }: StudyWidgetProps) {
  const isClass = kind === 'next-class'
  const title = isClass ? 'Ближайшие пары' : 'Ближайшие дедлайны'
  const action = isClass ? 'Открыть расписание' : 'Открыть домашки'

  return <WidgetPopover open={open} onOpenChange={onOpenChange} title={title}
    triggerLabel={label} triggerIcon={icon} triggerClassName={isClass ? '' : 'status-widget-deadlines'}
    contentClassName={`study-widget-popover ${isClass ? '' : 'study-widget-popover-deadlines'}`}>
    <div className="study-widget-header">
      <h2 className="study-widget-title">{title}</h2>
      <Badge variant="outline" className="study-widget-count">
        {isClass ? upcomingClassSlots.length : homeworkDeadlines.length}
      </Badge>
    </div>
    {isClass ? <ul className="study-widget-list" aria-label="Четыре ближайшие пары">
      {upcomingClassSlots.map(slot => <li key={slot.id} className="study-class-row">
        <div className="study-class-time">
          <time dateTime={`${slot.date}T${slot.startsAt}:00+03:00`}>{slot.startsAt}</time>
          <time className="study-class-end" dateTime={`${slot.date}T${slot.endsAt}:00+03:00`}>
            <span className="sr-only">Окончание: </span>{slot.endsAt}
          </time>
        </div>
        <div className="study-row-content">
          <p className="study-row-title">{slot.course}</p>
          <div className="study-row-meta">
            <time dateTime={slot.date}>{slot.dateLabel}</time>
            <span className="study-class-format">{slot.format}</span>
          </div>
        </div>
      </li>)}
    </ul> : <ul className="study-widget-list" aria-label="Ближайшие домашки">
      {homeworkDeadlines.map(homework => <li key={homework.id} className="study-homework-row">
        <p className="study-row-title">{homework.title}</p>
        <div className="study-row-meta study-homework-meta">
          <span>{homework.course}</span>
          <time className="study-homework-due" dateTime={homework.dueAt}>
            <span className="sr-only">Сдать до </span>{homework.dueLabel}
          </time>
        </div>
      </li>)}
    </ul>}
    <Button type="button" variant="outline" className="study-widget-action" onClick={onNavigate}>
      {action}
    </Button>
  </WidgetPopover>
}
