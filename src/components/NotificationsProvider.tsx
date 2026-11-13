import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createNotifications, type StudentNotification } from '@/data/notifications'
import { notificationDetails, notificationStorageKey, parseNotificationState } from '@/lib/notifications'

type NotificationsContextValue = {
  events: StudentNotification[]
  readIds: ReadonlySet<string>
  unreadCount: number
  storageError: string | null
  markRead: (id: string) => void
  markAllRead: () => void
}
const NotificationsContext = createContext<NotificationsContextValue | null>(null)
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => {
    try { return parseNotificationState(localStorage.getItem(notificationStorageKey), Date.now()) }
    catch { return parseNotificationState(null, Date.now()) }
  })
  const [storageError, setStorageError] = useState<string | null>(null)
  const events = useMemo(() => createNotifications(state.anchor).filter(event => notificationDetails(event) !== null).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [state.anchor])
  const readIds = useMemo(() => new Set(state.readIds), [state.readIds])
  useEffect(() => {
    try { localStorage.setItem(notificationStorageKey, JSON.stringify({ version: 1, ...state })); setStorageError(null) }
    catch { setStorageError('Не удалось сохранить прочтение. Проверь доступ к хранилищу браузера.') }
  }, [state])
  useEffect(() => {
    const update = (event: StorageEvent) => {
      if (event.key === notificationStorageKey) setState(parseNotificationState(event.newValue, Date.now()))
    }
    window.addEventListener('storage', update)
    return () => window.removeEventListener('storage', update)
  }, [])
  const value: NotificationsContextValue = {
    events, readIds, unreadCount: events.filter(event => !readIds.has(event.id)).length, storageError,
    markRead: id => setState(previous => previous.readIds.includes(id) || !events.some(event => event.id === id) ? previous : { ...previous, readIds: [...previous.readIds, id] }),
    markAllRead: () => setState(previous => events.every(event => previous.readIds.includes(event.id)) ? previous : { ...previous, readIds: events.map(event => event.id) }),
  }
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('NotificationsProvider is required')
  return context
}
