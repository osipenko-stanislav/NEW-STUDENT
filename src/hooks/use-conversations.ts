import { navigate, useNavigation } from '@/hooks/use-navigation'
import { useState } from 'react'
import { loadConversations, saveConversations, sortConversations } from '@/lib/conversation-storage'
import { createMockResponse, type MockResponse } from '@/lib/mock-assistant'
import { useMockGeneration } from '@/hooks/use-mock-generation'
import { createConversationTitle } from '@/lib/conversation-title'
import type { ChatMessage, Conversation, ConversationDraft } from '@/types/conversation'

export function useConversations() {
  const [snapshot, setSnapshot] = useState(loadConversations)
  const generation = useMockGeneration()
  const { conversationId: activeId } = useNavigation()
  const setActiveId = (conversationId: string | null, replace = false) => navigate({ conversationId }, replace)
  const activeConversation = snapshot.conversations.find(conversation => conversation.id === activeId) ?? null

  function sendMessage(draft: ConversationDraft, preparedResponse?: MockResponse) {
    const text = draft.text.trim()
    if ((!text && !draft.command) || (activeConversation && generation.isGenerating(activeConversation.id))) return
    const response = preparedResponse ?? createMockResponse(draft, activeConversation?.messages)
    const assistantId = crypto.randomUUID()
    // Keep activity strictly ordered even if two sends occur in the same millisecond.
    const now = snapshot.conversations.reduce((latest, conversation) => Math.max(latest, conversation.updatedAt + 1), Date.now())
    const messages: ChatMessage[] = [
      {
        id: crypto.randomUUID(), role: 'user', createdAt: now,
        content: text ? [{ type: 'text', text }] : [],
        ...(draft.command ? { command: `/${draft.command}` } : {}),
        ...(draft.attachments?.length ? { attachments: draft.attachments } : {}),
      },
      {
        id: assistantId, role: 'assistant', createdAt: now, ...response,
      },
    ]
    const conversation: Conversation = activeConversation
      ? { ...activeConversation, updatedAt: now, messages: [...activeConversation.messages, ...messages] }
      // Generate a title once. Continuing a conversation also preserves manual names.
      : { id: crypto.randomUUID(), title: createConversationTitle(draft), createdAt: now, updatedAt: now, messages }
    const conversations = sortConversations([
      ...snapshot.conversations.filter(item => item.id !== conversation.id), conversation,
    ])
    const saved = saveConversations(conversations)
    setSnapshot(saved)
    setActiveId(conversation.id)
    generation.start(conversation.id, assistantId, response.content.filter(part => part.type === 'text').map(part => part.text).join('').length)
    return { conversationId: conversation.id, persisted: !saved.storageError }
  }

  function openConversation(id: string) {
    if (snapshot.conversations.some(conversation => conversation.id === id)) setActiveId(id)
  }

  function deleteConversation(id: string) {
    generation.cancel(id)
    setSnapshot(current => saveConversations(current.conversations.filter(conversation => conversation.id !== id)))
    if (activeId === id) setActiveId(null, true)
  }

  function detachMaterial(materialId: string) {
    setSnapshot(current => saveConversations(current.conversations.map(conversation => ({
      ...conversation,
      messages: conversation.messages.map(message => message.attachments?.some(item => item.materialId === materialId)
        ? { ...message, attachments: message.attachments.map(item => item.materialId === materialId ? { ...item, materialId: null } : item) }
        : message),
    }))))
  }

  function clearConversations(): boolean {
    const saved = saveConversations([])
    if (saved.storageError) { setSnapshot(current => ({ ...current, storageError: saved.storageError })); return false }
    for (const conversation of snapshot.conversations) generation.cancel(conversation.id)
    setSnapshot(saved)
    setActiveId(null)
    return true
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
    activeGeneration: activeId ? generation.generations[activeId] : undefined,
    storageError: snapshot.storageError,
    sendMessage,
    openConversation,
    deleteConversation,
    detachMaterial,
    clearConversations,
    renameConversation,
    toggleConversationPin,
    startNewConversation: () => setActiveId(null),
  }
}
