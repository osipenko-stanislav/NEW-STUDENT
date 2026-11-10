import type { ConversationDraft } from '@/types/conversation'

export function createConversationTitle({ text, command }: ConversationDraft): string {
  const source = [command, text].filter(Boolean).join(' ').replace(/\s+/gu, ' ').trim()
  const cleaned = source.replace(/[\p{P}<>]+/gu, ' ').replace(/\s+/gu, ' ').trim()
  // Preserve symbol-only messages instead of inventing a generic name or using an ID.
  const words = (cleaned || source).split(' ').slice(0, 6).join(' ')
  return Array.from(words).slice(0, 60).join('').trim()
}
