import { useSyncExternalStore } from 'react'
import { useMaterialLibrary } from '@/components/MaterialLibraryProvider'

export function useConversationMaterials(conversationId: string | null) {
  const library = useMaterialLibrary()
  const snapshot = useSyncExternalStore(library.subscribe, library.getSnapshot)
  const scopeId = conversationId ?? snapshot.draftId
  const selectedIds = new Set(snapshot.attachments.filter(item => item.scopeId === scopeId).map(item => item.materialId))
  return { library, scopeId, materials: snapshot.materials,
    selectedMaterials: snapshot.materials.filter(material => selectedIds.has(material.id)),
    error: snapshot.error, isBusy: snapshot.pending > 0 }
}
