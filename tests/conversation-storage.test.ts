import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { loadConversations, saveConversations, sortConversations } from '../src/lib/conversation-storage.ts'
import type { Conversation } from '../src/types/conversation.ts'

const storageKey = 'student-conversations:v1'
let values: Map<string, string>
let originalStorage: PropertyDescriptor | undefined

beforeEach(() => {
  values = new Map()
  originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
    },
  })
})

afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else Reflect.deleteProperty(globalThis, 'localStorage')
})

function conversation(id: string, updatedAt: number): Conversation {
  return {
    id, title: '/Моя неделя', createdAt: 1, updatedAt,
    messages: [
      { id: `${id}-user`, role: 'user', command: '/Моя неделя', createdAt: 1, content: [] },
      { id: `${id}-assistant`, role: 'assistant', createdAt: 1, content: [{ type: 'text', text: 'Демонстрационный ответ' }] },
    ],
  }
}

test('opening an empty store does not create or persist conversations', () => {
  assert.deepEqual(loadConversations(), { conversations: [], storageError: null })
  assert.equal(values.size, 0)
})

test('round-trips conversations, including command-only messages', () => {
  const conversations = [conversation('first', 10)]
  assert.equal(saveConversations(conversations).storageError, null)
  assert.deepEqual(loadConversations(), { conversations, storageError: null })
  assert.equal(JSON.parse(values.get(storageKey)!).version, 1)
})

test('restores latest activity first without mutating the source list', () => {
  const conversations = [conversation('older', 10), conversation('newer', 20)]
  assert.deepEqual(sortConversations(conversations).map(item => item.id), ['newer', 'older'])
  assert.equal(conversations[0].id, 'older')
  saveConversations(conversations)
  assert.deepEqual(loadConversations().conversations.map(item => item.id), ['newer', 'older'])
})

test('deletion persists across a fresh read', () => {
  saveConversations([conversation('first', 10), conversation('second', 20)])
  saveConversations(loadConversations().conversations.filter(item => item.id !== 'second'))
  assert.deepEqual(loadConversations().conversations.map(item => item.id), ['first'])
  saveConversations([])
  assert.deepEqual(loadConversations().conversations, [])
})

test('pinned conversations come first, with last activity ordering inside each group', () => {
  const conversations = [
    conversation('recent', 40),
    { ...conversation('pinned-older', 10), pinned: true },
    conversation('older', 20),
    { ...conversation('pinned-recent', 30), pinned: true },
  ]
  const expected = ['pinned-recent', 'pinned-older', 'recent', 'older']
  assert.deepEqual(sortConversations(conversations).map(item => item.id), expected)
  saveConversations(conversations)
  assert.deepEqual(loadConversations().conversations.map(item => item.id), expected)
})

test('renamed titles and pin states survive reload alongside legacy conversations', () => {
  const legacy = conversation('legacy-without-pinned-field', 20)
  const renamed = { ...conversation('renamed', 10), title: 'Мой учебный план', pinned: true }
  saveConversations([legacy, renamed])
  const restored = loadConversations().conversations
  assert.deepEqual(restored, [renamed, legacy])
  const unpinned = restored.map(item => ({ ...item, pinned: false }))
  saveConversations(unpinned)
  assert.deepEqual(loadConversations().conversations.map(item => item.id), [legacy.id, renamed.id])
  assert.equal(loadConversations().conversations[1].title, 'Мой учебный план')
})

test('rejects corrupted or unsupported data without overwriting it on load', () => {
  for (const raw of [
    '{invalid json', 'null',
    JSON.stringify({ version: 2, conversations: [] }),
    JSON.stringify({ version: 1, conversations: [{ ...conversation('empty', 1), messages: [] }] }),
    JSON.stringify({ version: 1, conversations: [{ ...conversation('bad', 1), messages: [{ role: 'user', content: 'wrong' }] }] }),
    JSON.stringify({ version: 1, conversations: [{ ...conversation('bad-pin', 1), pinned: 'true' }] }),
  ]) {
    values.set(storageKey, raw)
    const result = loadConversations()
    assert.deepEqual(result.conversations, [])
    assert.ok(result.storageError)
    assert.equal(values.get(storageKey), raw)
  }
})

test('blocked storage does not crash reads or discard the in-memory conversation', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('Storage unavailable') },
  })
  assert.ok(loadConversations().storageError)
  const conversations = [conversation('in-memory', 10)]
  const result = saveConversations(conversations)
  assert.deepEqual(result.conversations, conversations)
  assert.ok(result.storageError)
})

test('quota errors keep the new messages in memory and preserve the last saved history', () => {
  const saved = [conversation('saved', 10)]
  saveConversations(saved)
  const previous = values.get(storageKey)
  localStorage.setItem = () => { throw new Error('QuotaExceededError') }
  const next = [...saved, conversation('new', 20)]
  const result = saveConversations(next)
  assert.deepEqual(result.conversations, next)
  assert.ok(result.storageError)
  assert.equal(values.get(storageKey), previous)
})


test('restores message attachments and unavailable-file tombstones without deleting messages', () => {
  const chat = conversation('attachments', 100)
  chat.messages[0].attachments = [{ materialId: 'shared-file', name: 'Заметки.txt' }, { materialId: null, name: 'Удаленный файл.txt' }]
  assert.equal(saveConversations([chat]).storageError, null)
  const restored = loadConversations()
  assert.equal(restored.storageError, null)
  assert.deepEqual(restored.conversations[0].messages, chat.messages)
})

test('round-trips all Generative UI block types while preserving legacy text messages', async () => {
  const { createMockResponse } = await import('../src/lib/mock-assistant.ts')
  const chats = ['Расписание сегодня', 'Моя неделя', 'Домашки', 'Материалы'].map((command, index) => {
    const chat = conversation(`generated-${index}`, 100 + index)
    Object.assign(chat.messages[1], createMockResponse({ command, text: '' }))
    return chat
  })
  assert.equal(saveConversations(chats).storageError, null)
  assert.deepEqual(loadConversations().conversations, sortConversations(chats))
})
