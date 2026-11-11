import { clearMaterialFiles } from './material-files.ts'

// Reset only this prototype's data; other apps may share the same origin.
const sessionKeys = [
  'student-conversations:v1',
  'student-materials:v1',
  'student-search-recent:v1',
  'student-theme:v1',
] as const

export async function resetSessionStorage(): Promise<void> {
  const previous = sessionKeys.map(key => [key, localStorage.getItem(key)] as const)
  try {
    for (const key of sessionKeys) localStorage.removeItem(key)
    // Clear the entire file store, including any records without readable metadata.
    await clearMaterialFiles()
  } catch (error) {
    // An aborted IndexedDB transaction leaves the files intact. Restore their links.
    for (const [key, value] of previous) {
      try {
        if (value === null) localStorage.removeItem(key)
        else localStorage.setItem(key, value)
      } catch { /* Storage may have become unavailable; report the reset failure. */ }
    }
    throw error
  }
  document.cookie = 'sidebar_state=; path=/; max-age=0'
}
