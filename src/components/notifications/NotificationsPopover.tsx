import { useState } from 'react'
import { Bell, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useNotifications } from '@/components/NotificationsProvider'
import type { StudentNotification } from '@/data/notifications'
import NotificationRow from './NotificationRow'
export default function NotificationsPopover({ onOpen, onHistory }: { onOpen: (event: StudentNotification) => void; onHistory: () => void }) {
  const [open, setOpen] = useState(false)
  const { events, unreadCount, storageError } = useNotifications()
  const now = Date.now()
  return <Popover open={open} onOpenChange={setOpen}>
    <Tooltip><TooltipTrigger asChild><PopoverTrigger asChild>
      <Button type="button" variant="ghost" size="icon" className="ghost-icon notification-trigger" aria-label="Уведомления" aria-describedby={unreadCount ? 'notifications-unread' : undefined}>
        <img src={`${import.meta.env.BASE_URL}assets/figma/bell03-lined.svg`} alt="" aria-hidden="true" className="design-icon" />{unreadCount ? <><span className="notification-trigger-dot" aria-hidden="true" /><span id="notifications-unread" className="sr-only">Непрочитанных: {unreadCount}</span></> : null}
      </Button>
    </PopoverTrigger></TooltipTrigger><TooltipContent>Уведомления</TooltipContent></Tooltip>
    <PopoverContent align="end" sideOffset={10} collisionPadding={16} className="notifications-popover" aria-labelledby="notifications-preview-title">
      <header className="notifications-preview-heading"><h2 id="notifications-preview-title">Уведомления</h2>{unreadCount ? <span className="notifications-count">{unreadCount} непрочитанных</span> : null}</header>
      {events.length ? <ul className="notifications-preview-list">{events.slice(0, 5).map(event => <NotificationRow key={event.id} event={event} now={now} compact onOpen={item => { setOpen(false); onOpen(item) }} />)}</ul> : <div className="notifications-empty"><Bell aria-hidden="true" /><p>Новых уведомлений пока нет</p></div>}
      {storageError ? <p className="notifications-storage-error" role="status">{storageError}</p> : null}
      <Button type="button" variant="ghost" className="notifications-history-link" onClick={() => { setOpen(false); onHistory() }}>Все уведомления<ArrowRight aria-hidden="true" /></Button>
    </PopoverContent>
  </Popover>
}
