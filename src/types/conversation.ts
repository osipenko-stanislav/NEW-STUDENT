import type { GenerativePart, MockContext } from './assistant.ts'

// Typed blocks are restored by the message renderer.
// Persist serializable data here, never React elements.
export type MessagePart = { type: 'text'; text: string } | GenerativePart

// A null materialId is a tombstone: preserve the filename without a live file link.
export type MessageAttachment = { materialId: string | null; name: string }

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: MessagePart[]
  command?: string
  attachments?: MessageAttachment[]
  mockContext?: MockContext
  suggestions?: string[]
  createdAt: number
}

export type Conversation = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  pinned?: boolean
  messages: ChatMessage[]
}

export type ConversationDraft = { text: string; command: string | null; attachments?: MessageAttachment[] }
