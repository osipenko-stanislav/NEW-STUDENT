import type { ConversationMaterial, MaterialAttachment, MaterialSnapshot } from '@/types/material'

const storageKey = 'student-materials:v1'
export const newMaterialDraftId = () => `draft:${crypto.randomUUID()}`

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isMaterial(value: unknown): value is ConversationMaterial {
  if (!isRecord(value)) return false
  return ['id', 'originId', 'name'].every(key => typeof value[key] === 'string' && (value[key] as string).length > 0)
    && (value.sourceAcademicId === undefined || typeof value.sourceAcademicId === 'string')
    && typeof value.type === 'string' && typeof value.size === 'number' && Number.isSafeInteger(value.size) && value.size >= 0
    && typeof value.addedAt === 'number' && Number.isFinite(value.addedAt) && value.addedAt >= 0 && !Number.isNaN(new Date(value.addedAt).getTime())
}

function isAttachment(value: unknown): value is MaterialAttachment {
  return isRecord(value) && typeof value.scopeId === 'string' && value.scopeId.length > 0
    && typeof value.materialId === 'string' && value.materialId.length > 0
}

export function loadMaterialMetadata(): MaterialSnapshot {
  const empty: MaterialSnapshot = { draftId: newMaterialDraftId(), materials: [], attachments: [], error: null, pending: 0 }
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return empty
    const data: unknown = JSON.parse(raw)
    if (!isRecord(data) || typeof data.draftId !== 'string' || !data.draftId.startsWith('draft:')
      || !Array.isArray(data.materials)) throw new Error('Invalid material metadata')
    let materials: unknown[] = data.materials
    let attachments: unknown = data.attachments
    if (data.version === 1) {
      // Retain IDs and bytes in the existing IndexedDB store. Upgrade on the next successful write.
      materials = data.materials.map(item => isRecord(item) ? { ...item, originId: item.ownerId } : item)
      attachments = data.materials.map(item => isRecord(item) ? { scopeId: item.ownerId, materialId: item.id } : item)
    } else if (data.version !== 2) throw new Error('Unsupported material metadata')
    if (!materials.every(isMaterial) || new Set(materials.map(item => item.id)).size !== materials.length
      || !Array.isArray(attachments) || !attachments.every(isAttachment)) throw new Error('Invalid material metadata')
    const ids = new Set(materials.map(item => item.id))
    const unique = new Map(attachments.filter(item => ids.has(item.materialId))
      .map(item => [JSON.stringify([item.scopeId, item.materialId]), item]))
    return { ...empty, draftId: data.draftId, materials: materials.map(({ id, originId, name, type, size, addedAt, sourceAcademicId }) => ({ id, originId, name, type, size, addedAt, ...(sourceAcademicId ? { sourceAcademicId } : {}) })), attachments: [...unique.values()] }
  } catch {
    return { ...empty, error: 'Не удалось восстановить список материалов. Проверь доступ к хранилищу браузера.' }
  }
}

export function saveMaterialMetadata(snapshot: Pick<MaterialSnapshot, 'draftId' | 'materials' | 'attachments'>): void {
  localStorage.setItem(storageKey, JSON.stringify({
    version: 2, draftId: snapshot.draftId,
    // Explicit allowlist: file contents and File/Blob objects never enter localStorage.
    materials: snapshot.materials.map(({ id, originId, name, type, size, addedAt, sourceAcademicId }) => ({ id, originId, name, type, size, addedAt, ...(sourceAcademicId ? { sourceAcademicId } : {}) })),
    attachments: snapshot.attachments.map(({ scopeId, materialId }) => ({ scopeId, materialId })),
  }))
}

export function formatMaterialSize(bytes: number): string {
  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  const index = bytes === 0 ? 0 : Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: index === 0 ? 0 : 1 }).format(bytes / 1024 ** index)} ${units[index]}`
}

export function materialType(material: Pick<ConversationMaterial, 'name' | 'type'>): string {
  const extension = material.name.includes('.') ? material.name.split('.').pop() : ''
  return extension ? extension.toLocaleUpperCase('ru') : material.type || 'Файл'
}

export function previewMaterialType(type: string): string | null {
  const safeTypes = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'image/bmp']
  return safeTypes.includes(type) ? type : null
}
