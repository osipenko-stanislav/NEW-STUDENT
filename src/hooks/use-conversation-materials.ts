import { useState, useSyncExternalStore } from 'react'
import { MaterialLibrary } from '@/lib/material-library'

export function useConversationMaterials(conversationId: string | null) {
  const [library] = useState(() => new MaterialLibrary())
  const snapshot = useSyncExternalStore(library.subscribe, library.getSnapshot)
  const scopeId = conversationId ?? snapshot.draftId
  const selectedIds = new Set(snapshot.attachments.filter(item => item.scopeId === scopeId).map(item => item.materialId))
  return { library, scopeId, materials: snapshot.materials,
    selectedMaterials: snapshot.materials.filter(material => selectedIds.has(material.id)),
    error: snapshot.error, isBusy: snapshot.pending > 0 }
}
