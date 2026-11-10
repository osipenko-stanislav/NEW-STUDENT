import { useState } from 'react'
import { loadConversations, saveConversations, sortConversations } from '@/lib/conversation-storage'
import { createConversationTitle } from '@/lib/conversation-title'
import type { ChatMessage, Conversation, ConversationDraft } from '@/types/conversation'

export function useConversations() {
  const [snapshot, setSnapshot] = useState(loadConversations)
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeConversation = snapshot.conversations.find(conversation => conversation.id === activeId) ?? null

  function sendMessage(draft: ConversationDraft) {
    const text = draft.text.trim()
    if (!text && !draft.command) return
    // Keep activity strictly ordered even if two sends occur in the same millisecond.
    const now = snapshot.conversations.reduce((latest, conversation) => Math.max(latest, conversation.updatedAt + 1), Date.now())
    const messages: ChatMessage[] = [
      {
        id: crypto.randomUUID(), role: 'user', createdAt: now,
        content: text ? [{ type: 'text', text }] : [],
        ...(draft.command ? { command: `/${draft.command}` } : {}),
      },
      {
        id: crypto.randomUUID(), role: 'assistant', createdAt: now,
        content: [{ type: 'text', text: 'Это демонстрационный ответ. Вы можете продолжить разговор: новые сообщения появятся здесь.' }],
      },
    ]
    const conversation: Conversation = activeConversation
      ? { ...activeConversation, updatedAt: now, messages: [...activeConversation.messages, ...messages] }
      // Generate a title once. Continuing a conversation also preserves manual names.
      : { id: crypto.randomUUID(), title: createConversationTitle(draft), createdAt: now, updatedAt: now, messages }
    const conversations = sortConversations([
      ...snapshot.conversations.filter(item => item.id !== conversation.id), conversation,
    ])
    setSnapshot(saveConversations(conversations))
    setActiveId(conversation.id)
  }

  function openConversation(id: string) {
    if (snapshot.conversations.some(conversation => conversation.id === id)) setActiveId(id)
  }

  function deleteConversation(id: string) {
    setSnapshot(saveConversations(snapshot.conversations.filter(conversation => conversation.id !== id)))
    if (activeId === id) setActiveId(null)
  }

  function renameConversation(id: string, title: string) {
    const name = title.trim()
    if (!name) return
    const conversations = snapshot.conversations.map(conversation => conversation.id === id
      ? { ...conversation, title: name } : conversation)
    setSnapshot(saveConversations(conversations))
  }

  function toggleConversationPin(id: string) {
    const conversations = snapshot.conversations.map(conversation => conversation.id === id
      ? { ...conversation, pinned: !conversation.pinned } : conversation)
    setSnapshot(saveConversations(sortConversations(conversations)))
  }

  return {
    conversations: snapshot.conversations,
    activeConversation,
    storageError: snapshot.storageError,
    sendMessage,
    openConversation,
    deleteConversation,
    renameConversation,
    toggleConversationPin,
    startNewConversation: () => setActiveId(null),
  }
}
