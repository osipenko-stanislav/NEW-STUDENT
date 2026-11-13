export const settingsStorageKey = 'student-settings:v1'
export type UserSettings = {
  downloadFolder: string
  downloadAutoSync: boolean
  downloadInterval: 15 | 30 | 60
  timeFormat: '24' | '12'
  dateFormat: 'long' | 'numeric' | 'iso'
  density: 'comfortable' | 'compact'
  textSize: 'small' | 'default' | 'large'
  interfaceAnimations: boolean
  orbAnimation: boolean
  sendShortcut: 'enter' | 'modifier-enter'
  spellcheck: boolean
  confirmConversationDeletion: boolean
  historyMode: 'collapsed' | 'expanded' | 'hidden'
  hiddenWidgets: string[]
  hiddenSuggestions: string[]
}
export const defaultSettings: UserSettings = {
  downloadFolder: '', downloadAutoSync: true, downloadInterval: 30,
  timeFormat: '24', dateFormat: 'long', density: 'comfortable', textSize: 'default',
  interfaceAnimations: true, orbAnimation: true, sendShortcut: 'enter', spellcheck: true, confirmConversationDeletion: true,
  historyMode: 'collapsed', hiddenWidgets: [], hiddenSuggestions: [],
}

export function normalizeSettings(value: unknown): UserSettings {
  const result = { ...defaultSettings, hiddenWidgets: [], hiddenSuggestions: [] } as UserSettings
  if (!value || typeof value !== 'object') return result
  const record = value as Record<string, unknown>
  const options = {
    timeFormat: ['24', '12'], dateFormat: ['long', 'numeric', 'iso'], density: ['comfortable', 'compact'],
    textSize: ['small', 'default', 'large'], sendShortcut: ['enter', 'modifier-enter'], historyMode: ['collapsed', 'expanded', 'hidden'],
  } as const
  for (const key of Object.keys(options) as (keyof typeof options)[]) {
    if ((options[key] as readonly unknown[]).includes(record[key])) Object.assign(result, { [key]: record[key] })
  }
  for (const key of ['interfaceAnimations', 'orbAnimation', 'spellcheck', 'confirmConversationDeletion', 'downloadAutoSync'] as const) {
    if (typeof record[key] === 'boolean') result[key] = record[key]
  }
  for (const key of ['hiddenWidgets', 'hiddenSuggestions'] as const) {
    if (Array.isArray(record[key]) && record[key].every(item => typeof item === 'string')) result[key] = [...new Set(record[key])]
  }
  if (typeof record.downloadFolder === 'string') result.downloadFolder = record.downloadFolder.trim().slice(0, 512)
  if ([15, 30, 60].includes(Number(record.downloadInterval))) result.downloadInterval = Number(record.downloadInterval) as 15 | 30 | 60
  return result
}

export function loadSettings(): { settings: UserSettings; error: string | null } {
  try {
    const raw = localStorage.getItem(settingsStorageKey)
    if (!raw) return { settings: normalizeSettings(null), error: null }
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1 || !('settings' in data)) throw new Error('Invalid settings')
    return { settings: normalizeSettings(data.settings), error: null }
  } catch {
    return { settings: normalizeSettings(null), error: 'Не удалось восстановить настройки. Проверь доступ к хранилищу браузера.' }
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(settingsStorageKey, JSON.stringify({ version: 1, settings: normalizeSettings(settings) }))
}
