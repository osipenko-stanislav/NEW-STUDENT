import { clearMaterialFiles, deleteMaterialFiles, getMaterialFile, putMaterialFiles } from './material-files.ts'
import { loadMaterialMetadata, newMaterialDraftId, saveMaterialMetadata } from './material-metadata.ts'
import { resetSessionStorage } from './session-reset.ts'
import type { ConversationMaterial, MaterialSnapshot } from '@/types/material'

function storageError(error: unknown, fallback: string): string {
  return error instanceof DOMException && error.name === 'QuotaExceededError'
    ? 'Не хватает места для файла. Удали ненужные материалы или выбери файл меньшего размера.'
    : fallback
}

export class MaterialLibrary {
  private snapshot = loadMaterialMetadata()
  private listeners = new Set<() => void>()
  private queue: Promise<void> = Promise.resolve()
  private closedScopes = new Set<string>()
  private resetting = false

  getSnapshot = () => this.snapshot
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }

  private update(patch: Partial<MaterialSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch }
    for (const listener of this.listeners) listener()
  }

  clearError = () => this.update({ error: null })
  reportError = (error: string) => this.update({ error })

  private run<T>(action: () => Promise<T>, fallback: T, message: string): Promise<T> {
    this.update({ pending: this.snapshot.pending + 1, error: null })
    const operation = this.queue.then(action).catch(error => {
      this.update({ error: storageError(error, message) })
      return fallback
    }).finally(() => this.update({ pending: this.snapshot.pending - 1 }))
    this.queue = operation.then(() => undefined)
    return operation
  }

  add(files: File[], scopeId: string, sourceAcademicId?: string): Promise<ConversationMaterial[]> {
    if (this.resetting) return Promise.resolve([])
    return this.run(async () => {
      if (this.resetting || !files.length) return []
      const added = files.map(file => ({ id: crypto.randomUUID(), originId: scopeId, name: file.name,
        type: file.type, size: file.size, addedAt: Date.now(), ...(sourceAcademicId ? { sourceAcademicId } : {}) }))
      await putMaterialFiles(added.map((material, index) => ({ id: material.id, blob: files[index] })))
      if (this.resetting) { await deleteMaterialFiles(added.map(file => file.id)); return [] }
      const materials = [...this.snapshot.materials, ...added]
      const attachments = this.closedScopes.has(scopeId) ? this.snapshot.attachments : [
        ...this.snapshot.attachments, ...added.map(material => ({ scopeId, materialId: material.id })),
      ]
      try { saveMaterialMetadata({ ...this.snapshot, materials, attachments }) }
      catch (error) { await deleteMaterialFiles(added.map(file => file.id)); throw error }
      this.update({ materials, attachments })
      return added
    }, [], 'Не удалось сохранить файл. Разреши хранение данных в браузере и попробуй еще раз.')
  }

  private async removeWhere(predicate: (material: ConversationMaterial) => boolean) {
    const removed = this.snapshot.materials.filter(predicate)
    if (!removed.length) return
    const ids = new Set(removed.map(material => material.id))
    const materials = this.snapshot.materials.filter(material => !ids.has(material.id))
    const attachments = this.snapshot.attachments.filter(attachment => !ids.has(attachment.materialId))
    const previousMaterials = this.snapshot.materials
    const previousAttachments = this.snapshot.attachments
    saveMaterialMetadata({ ...this.snapshot, materials, attachments })
    this.update({ materials, attachments })
    try { await deleteMaterialFiles([...ids]) }
    catch (error) {
      // Navigation may have changed the selection during the transaction. Restore only live scopes.
      const restored = { ...this.snapshot, materials: previousMaterials,
        attachments: [...this.snapshot.attachments, ...previousAttachments.filter(item => ids.has(item.materialId) && !this.closedScopes.has(item.scopeId))] }
      this.update({ materials: restored.materials, attachments: restored.attachments })
      saveMaterialMetadata(restored)
      throw error
    }
  }

  remove(id: string): Promise<boolean> {
    return this.run(async () => { await this.removeWhere(material => material.id === id); return true },
      false, 'Не удалось удалить файл. Проверь доступ к хранилищу браузера и попробуй еще раз.')
  }

  clear(): Promise<boolean> {
    return this.run(async () => {
      const previous = this.snapshot
      const next = { ...previous, materials: [], attachments: [] }
      saveMaterialMetadata(next)
      try { await clearMaterialFiles() }
      catch (error) { saveMaterialMetadata(previous); throw error }
      this.update({ materials: [], attachments: [] })
      return true
    }, false, 'Не удалось очистить библиотеку. Проверь доступ к хранилищу браузера.')
  }

  forgetConversationSelections(ids: string[]): boolean {
    const removed = new Set(ids)
    const saved = this.saveSelection(this.snapshot.attachments.filter(item => !removed.has(item.scopeId)))
    if (saved) for (const id of ids) this.closedScopes.add(id)
    return saved
  }

  private saveSelection(attachments: MaterialSnapshot['attachments']): boolean {
    try { saveMaterialMetadata({ ...this.snapshot, attachments }) }
    catch {
      this.reportError('Не удалось сохранить вложения. Проверь доступ к хранилищу браузера.')
      return false
    }
    this.update({ attachments, error: null })
    return true
  }

  attach(materialId: string, scopeId: string): boolean {
    if (this.resetting || this.snapshot.pending > 0 || this.closedScopes.has(scopeId) || !this.snapshot.materials.some(material => material.id === materialId)) return false
    if (this.snapshot.attachments.some(item => item.materialId === materialId && item.scopeId === scopeId)) return true
    return this.saveSelection([...this.snapshot.attachments, { materialId, scopeId }])
  }

  detach(materialId: string, scopeId: string): boolean {
    if (this.resetting || this.snapshot.pending > 0) return false
    return this.saveSelection(this.snapshot.attachments.filter(item => item.materialId !== materialId || item.scopeId !== scopeId))
  }

  removeConversation(scopeId: string): boolean {
    // Deleting a chat removes selections only. File provenance and bytes are retained.
    this.closedScopes.add(scopeId)
    if (!this.snapshot.attachments.some(item => item.scopeId === scopeId)) return true
    const saved = this.saveSelection(this.snapshot.attachments.filter(item => item.scopeId !== scopeId))
    if (!saved) this.closedScopes.delete(scopeId)
    return saved
  }

  startNewDraft() {
    const previousDraft = this.snapshot.draftId
    this.closedScopes.add(previousDraft)
    const next = { ...this.snapshot, draftId: newMaterialDraftId(),
      attachments: this.snapshot.attachments.filter(item => item.scopeId !== previousDraft) }
    try { saveMaterialMetadata(next) }
    catch { this.reportError('Не удалось сохранить новый черновик. Проверь доступ к хранилищу браузера.') }
    this.update({ draftId: next.draftId, attachments: next.attachments })
  }

  completeSend(scopeId: string, conversationId: string): boolean {
    const materials = this.snapshot.materials.map(material => material.originId === scopeId && scopeId.startsWith('draft:')
      ? { ...material, originId: conversationId } : material)
    const attachments = this.snapshot.attachments.filter(item => item.scopeId !== scopeId)
    const draftId = scopeId === this.snapshot.draftId ? newMaterialDraftId() : this.snapshot.draftId
    try { saveMaterialMetadata({ ...this.snapshot, draftId, materials, attachments }) }
    catch {
      this.reportError('Не удалось сохранить связи файлов с разговором. Проверь доступ к хранилищу браузера.')
      return false
    }
    if (scopeId.startsWith('draft:')) this.closedScopes.add(scopeId)
    this.update({ draftId, materials, attachments })
    return true
  }

  resetSession(): Promise<boolean> {
    this.resetting = true
    // The queue drains pending writes before the reset; none can repopulate storage afterwards.
    return this.run(async () => {
      try { await resetSessionStorage() }
      catch (error) { this.resetting = false; throw error }
      this.update({ draftId: newMaterialDraftId(), materials: [], attachments: [] })
      return true
    }, false, 'Не удалось полностью сбросить сессию. Проверь доступ к хранилищу браузера и повтори сброс.')
  }

  async read(id: string): Promise<Blob | null> {
    if (!this.snapshot.materials.some(material => material.id === id)) return null
    try {
      const blob = await getMaterialFile(id)
      if (!blob) throw new Error('Missing local file')
      return blob
    } catch {
      this.reportError('Не удалось открыть файл. Проверь доступ к хранилищу браузера и попробуй еще раз.')
      return null
    }
  }
}
