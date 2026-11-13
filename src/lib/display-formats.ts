import type { UserSettings } from './settings-storage.ts'

type Formats = Pick<UserSettings, 'dateFormat' | 'timeFormat'>
const timeZone = 'Europe/Moscow'
const asDate = (value: string | number | Date) => value instanceof Date ? value
  : new Date(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00+03:00` : value)

export function displayDate(value: string | number | Date, settings: Formats, compact = false): string {
  const date = asDate(value)
  if (settings.dateFormat === 'iso') return new Intl.DateTimeFormat('sv-SE', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  return new Intl.DateTimeFormat('ru-RU', { timeZone, day: '2-digit',
    month: settings.dateFormat === 'numeric' ? '2-digit' : compact ? 'short' : 'long',
    ...(!compact || settings.dateFormat === 'numeric' ? { year: 'numeric' as const } : {}),
  }).format(date)
}
export function displayTime(value: string | number | Date, settings: Formats): string {
  const date = typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? asDate(`2026-11-11T${value}:00+03:00`) : asDate(value)
  return new Intl.DateTimeFormat('ru-RU', { timeZone, hour: '2-digit', minute: '2-digit', hour12: settings.timeFormat === '12' }).format(date)
}
export function displayDateTime(value: string | number | Date, settings: Formats, compact = false): string {
  return `${displayDate(value, settings, compact)}, ${displayTime(value, settings)}`
}
