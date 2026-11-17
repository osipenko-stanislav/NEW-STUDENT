import { NotificationIndicator } from '@/components/ui/notification-indicator'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { PreviewPopoverContent } from '@/components/ui/preview-popover'
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
        <NotificationIndicator count={unreadCount} />{unreadCount ? <span id="notifications-unread" className="sr-only">Непрочитанных: {unreadCount}</span> : null}
      </Button>
    </PopoverTrigger></TooltipTrigger><TooltipContent>Уведомления</TooltipContent></Tooltip>
    <PreviewPopoverContent title="Уведомления" className="notifications-popover"
      meta={unreadCount ? <><AnimatedNumber value={unreadCount} minDigits={2} /> непрочитанных</> : undefined}
      action={{ label: 'Все уведомления', onClick: () => { setOpen(false); onHistory() } }}>
      {events.length ? <ul className="notifications-preview-list">{events.slice(0, 5).map(event => <NotificationRow key={event.id} event={event} now={now} compact onOpen={item => { setOpen(false); onOpen(item) }} />)}</ul> : <div className="notifications-empty"><Bell aria-hidden="true" /><p>Новых уведомлений пока нет</p></div>}
      {storageError ? <p className="notifications-storage-error" role="status">{storageError}</p> : null}
    </PreviewPopoverContent>
  </Popover>
}
