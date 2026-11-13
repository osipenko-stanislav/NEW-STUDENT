import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { loadSettings, normalizeSettings, saveSettings, settingsStorageKey, type UserSettings } from '@/lib/settings-storage'
import { displayDate, displayDateTime, displayTime } from '@/lib/display-formats'

type SettingsContextValue = {
  settings: UserSettings
  error: string | null
  updateSettings: (patch: Partial<UserSettings>) => boolean
  resetSettings: () => boolean
}
const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(loadSettings)
  const current = useRef(snapshot.settings)
  current.current = snapshot.settings
  useLayoutEffect(() => {
    document.documentElement.dataset.density = snapshot.settings.density
    document.documentElement.dataset.textSize = snapshot.settings.textSize
    document.documentElement.style.setProperty('--text-scale', { small: '0.93', default: '1', large: '1.12' }[snapshot.settings.textSize])
  }, [snapshot.settings.density, snapshot.settings.textSize])
  function updateSettings(patch: Partial<UserSettings>) {
    const settings = normalizeSettings({ ...current.current, ...patch })
    try { saveSettings(settings) }
    catch { setSnapshot(previous => ({ ...previous, error: 'Не удалось сохранить настройки. Проверь доступ к хранилищу браузера.' })); return false }
    current.current = settings
    setSnapshot({ settings, error: null })
    return true
  }
  function resetSettings() {
    try { localStorage.removeItem(settingsStorageKey) }
    catch { setSnapshot(previous => ({ ...previous, error: 'Не удалось сбросить настройки. Проверь доступ к хранилищу браузера.' })); return false }
    const settings = normalizeSettings(null)
    current.current = settings
    setSnapshot({ settings, error: null })
    return true
  }
  return <SettingsContext.Provider value={{ ...snapshot, updateSettings, resetSettings }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('SettingsProvider is required')
  return value
}

export function useDisplayFormats() {
  const { settings } = useSettings()
  return {
    formatDate: (value: string | number | Date, compact = false) => displayDate(value, settings, compact),
    formatTime: (value: string | number | Date) => displayTime(value, settings),
    formatDateTime: (value: string | number | Date, compact = false) => displayDateTime(value, settings, compact),
  }
}
