import { academicMaterials } from '../data/academic-data.ts'
import type { ConversationMaterial } from '../types/material.ts'

export const publishedMaterialRevision = 2
export const syncStorageKey = 'student-material-sync:v1'
export type SyncStatus = 'current' | 'update' | 'syncing' | 'error'
export type SyncRecord = { version: 1; lastSync: number | null; error: string | null }
export function localMaterialRevision(materials: readonly ConversationMaterial[]): number {
  return Math.min(...academicMaterials.map(item => materials.find(file => file.sourceAcademicId === item.id)?.academicRevision ?? 0))
}
export function materialSyncStatus(revision: number, error: string | null): SyncStatus {
  return error ? 'error' : revision < publishedMaterialRevision ? 'update' : 'current'
}
export function loadSyncRecord(): SyncRecord {
  try {
    const value = JSON.parse(localStorage.getItem(syncStorageKey) ?? 'null')
    if (value?.version === 1) return { version: 1,
      lastSync: typeof value.lastSync === 'number' && Number.isFinite(value.lastSync) && value.lastSync > 0 ? value.lastSync : null,
      error: typeof value.error === 'string' ? value.error : null }
  } catch { /* The file library reports its own storage errors. */ }
  return { version: 1, lastSync: null, error: null }
}
export function academicFileName(id: string): string {
  const material = academicMaterials.find(item => item.id === id)!
  const extension = `.${material.fileType.toLowerCase()}`
  return material.title.toLowerCase().endsWith(extension) ? material.title : `${material.title}${extension}`
}
// A prepared local set, not a remote synchronization implementation.
export async function preparedAcademicFiles(revision: number) {
  const { default: prepared } = await import('../data/local-materials.ts')
  return prepared.map(file => {
    const material = academicMaterials.find(item => item.id === file.id)!
    const mime = material.fileType === 'PDF' ? 'application/pdf' : material.fileType === 'MD' ? 'text/markdown' : 'application/x-ipynb+json'
    const bytes = Uint8Array.from(atob(file.bytes), character => character.charCodeAt(0))
    const addition = revision >= 2 && material.fileType === 'MD'
      ? '\n\n## Проверка перед практикой\n\nСформулируй цель, проверь решение на небольшом примере и запиши вывод.\n' : ''
    return { sourceAcademicId: file.id, name: academicFileName(file.id), blob: new Blob([bytes, addition], { type: mime }) }
  })
}
export function exportBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = name
  document.body.append(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
