import { useLayoutEffect, useRef, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { EmptyState } from '@/components/ui/empty-state'
import { useNotifications } from '@/components/NotificationsProvider'
import { notificationFilters, type NotificationFilter, type StudentNotification } from '@/data/notifications'
import { filterNotifications, notificationDay, notificationGroupLabel } from '@/lib/notifications'
import NotificationRow from './NotificationRow'
export default function NotificationsWorkspace({ onOpen }: { onOpen: (event: StudentNotification) => void }) {
  const { events, readIds, unreadCount, markAllRead, storageError } = useNotifications()
  const [category, setCategory] = useState<NotificationFilter>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => { titleRef.current?.focus({ preventScroll: true }) }, [])
  const now = Date.now()
  const filtered = filterNotifications(events, readIds, category, unreadOnly)
  const groups = new Map<string, StudentNotification[]>()
  for (const event of filtered) { const day = notificationDay(event.createdAt); groups.set(day, [...(groups.get(day) ?? []), event]) }
  return <section className="page-container notifications-page" data-layout="workspace" aria-labelledby="notifications-title">
    <header className="notifications-heading"><h1 id="notifications-title" ref={titleRef} tabIndex={-1}>Уведомления</h1>
      <Button type="button" variant="ghost" size="sm" disabled={!unreadCount} onClick={markAllRead}><CheckCheck aria-hidden="true" />Отметить все как прочитанные</Button>
    </header>
    <div className="notifications-toolbar"><SegmentedControl aria-label="Категории уведомлений">{notificationFilters.map(filter => <Button key={filter.value} type="button" variant="ghost" aria-pressed={category === filter.value} onClick={() => setCategory(filter.value)}>{filter.label}</Button>)}</SegmentedControl>
      <label className="notifications-unread-toggle" htmlFor="notifications-unread-only">Только непрочитанные<Switch id="notifications-unread-only" checked={unreadOnly} onCheckedChange={setUnreadOnly} /></label>
    </div>
    <p className="sr-only" role="status">Непрочитанных: {unreadCount}. Показано: {filtered.length}.</p>
    {storageError ? <p className="notifications-storage-error" role="status">{storageError}</p> : null}
    <div className="notifications-feed" key={`${category}/${unreadOnly}`}>{groups.size ? [...groups].map(([day, items]) => <section className="notification-day" key={day} aria-labelledby={`notification-day-${day}`}><h2 id={`notification-day-${day}`}>{notificationGroupLabel(items[0].createdAt, now)}</h2><ul>{items.map(event => <NotificationRow key={event.id} event={event} now={now} onOpen={onOpen} />)}</ul></section>) : <EmptyState icon={Bell} title={unreadOnly ? 'Непрочитанных уведомлений нет' : 'Уведомлений пока нет'} description={unreadOnly ? 'Когда появится что-то новое, ты увидишь это здесь.' : 'Новые события появятся в этом разделе.'} />}</div>
  </section>
}
