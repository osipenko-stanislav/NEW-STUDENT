import { useLateDays } from '@/components/LateDaysProvider'
import { BookOpen, CalendarDays, CheckCheck, Clock3, FileText } from 'lucide-react'
import type { StudentNotification } from '@/data/notifications'
import { notificationDetails, notificationRelativeTime } from '@/lib/notifications'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { useNotifications } from '@/components/NotificationsProvider'
const icons = { reviewed: CheckCheck, deadline: Clock3, material: FileText, class: CalendarDays, course: BookOpen }
export default function NotificationRow({ event, compact = false, now, onOpen }: { event: StudentNotification; compact?: boolean; now: number; onOpen: (event: StudentNotification) => void }) {
  const { readIds } = useNotifications()
  const { formatDateTime } = useDisplayFormats()
  const { deadline } = useLateDays()
  const details = notificationDetails(event, deadline)
  if (!details) return null
  const unread = !readIds.has(event.id)
  const Icon = icons[event.type]
  return <li className="notification-item" data-unread={unread} data-notification-id={event.id}>
    <button type="button" className={`notification-row ${compact ? 'notification-row-compact' : ''}`} onClick={() => onOpen(event)}>
      <span className={`notification-icon notification-icon-${event.type}`}><Icon aria-hidden="true" /></span>
      <span className="notification-copy"><span className="notification-title">{details.title}</span>
        {!compact ? <span className="notification-description">{details.description}</span> : null}
        <span className="notification-source">{details.source}{event.important ? <span className="notification-priority"> · Важное</span> : null}</span>
        <time dateTime={event.createdAt} title={`${formatDateTime(event.createdAt)} МСК`}>{notificationRelativeTime(event.createdAt, now)}</time>
      </span>
      <span className="notification-read-indicator" aria-hidden="true" />
      <span className="sr-only">{unread ? 'Не прочитано' : 'Прочитано'}</span>
    </button>
  </li>
}
