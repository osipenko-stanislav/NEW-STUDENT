import type { ChatMessage, Conversation } from '@/types/conversation'

const storageKey = 'student-conversations:v1'
export type ConversationSnapshot = { conversations: Conversation[]; storageError: string | null }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isMessage(value: unknown): value is ChatMessage {
  return isRecord(value) && typeof value.id === 'string' && value.id.length > 0
    && (value.role === 'user' || value.role === 'assistant') && isTimestamp(value.createdAt)
    && (value.command === undefined || typeof value.command === 'string')
    && Array.isArray(value.content)
    && value.content.every(part => isRecord(part) && part.type === 'text' && typeof part.text === 'string')
    && (value.content.length > 0 || (typeof value.command === 'string' && value.command.length > 0))
}

function isConversation(value: unknown): value is Conversation {
  return isRecord(value) && typeof value.id === 'string' && value.id.length > 0
    && typeof value.title === 'string' && value.title.trim().length > 0
    && isTimestamp(value.createdAt) && isTimestamp(value.updatedAt)
    && (value.pinned === undefined || typeof value.pinned === 'boolean')
    && Array.isArray(value.messages) && value.messages.length > 0
    && value.messages.every(isMessage) && value.messages[0].role === 'user'
}

export function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt)
}

export function loadConversations(): ConversationSnapshot {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return { conversations: [], storageError: null }
    const data: unknown = JSON.parse(raw)
    if (!isRecord(data) || data.version !== 1 || !Array.isArray(data.conversations)
      || !data.conversations.every(isConversation)) throw new Error('Invalid conversation store')
    return { conversations: sortConversations(data.conversations), storageError: null }
  } catch {
    return {
      conversations: [],
      storageError: 'Не удалось прочитать сохраненные диалоги.',
    }
  }
}

export function saveConversations(conversations: Conversation[]): ConversationSnapshot {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, conversations }))
    return { conversations, storageError: null }
  } catch {
    return {
      conversations,
      storageError: 'Не удалось сохранить историю. Переписка доступна до перезагрузки страницы.',
    }
  }
}
