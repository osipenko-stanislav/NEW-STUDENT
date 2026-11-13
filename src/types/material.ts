export type ConversationMaterial = {
  sourceAcademicId?: string
  id: string
  // Upload provenance only, never an access or visibility restriction.
  // A draft:<UUID> is replaced by the first conversation created from that draft.
  originId: string
  name: string
  type: string
  size: number
  addedAt: number
}

export type MaterialAttachment = { scopeId: string; materialId: string }

export type MaterialSnapshot = {
  draftId: string
  materials: ConversationMaterial[]
  // Files selected for the next message, independent of the global file catalog.
  attachments: MaterialAttachment[]
  error: string | null
  pending: number
}
