// Extend this union and its renderer when messages gain Generative UI blocks.
// Persist serializable data here, never React elements.
export type MessagePart = { type: 'text'; text: string }

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: MessagePart[]
  command?: string
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

export type ConversationDraft = { text: string; command: string | null }
