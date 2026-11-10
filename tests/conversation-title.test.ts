import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createConversationTitle } from '../src/lib/conversation-title.ts'

test('uses the suggestion name without a command slash', () => {
  assert.equal(createConversationTitle({ command: 'Моя неделя', text: '' }), 'Моя неделя')
  assert.equal(createConversationTitle({ command: '/Расписание сегодня', text: '   ' }), 'Расписание сегодня')
  assert.equal(createConversationTitle({ command: 'Домашки', text: '' }), 'Домашки')
})

test('includes clarification after a suggestion', () => {
  assert.equal(createConversationTitle({ command: 'Моя неделя', text: 'практики после обеда' }), 'Моя неделя практики после обеда')
  assert.equal(createConversationTitle({ command: 'Материалы', text: '  по математике!!!  ' }), 'Материалы по математике')
})

test('normalizes whitespace and punctuation without rewriting the request', () => {
  assert.equal(createConversationTitle({ command: null, text: '  Помоги,\n подготовиться\tк экзамену по математике!!! ' }),
    'Помоги подготовиться к экзамену по математике')
  assert.equal(createConversationTitle({ command: null, text: '> **Разобрать** тему: «Производные».' }), 'Разобрать тему Производные')
  assert.equal(createConversationTitle({ command: null, text: '/Моя   неделя' }), 'Моя неделя')
})

test('uses at most the first six words and never pads short requests', () => {
  assert.equal(createConversationTitle({ command: null, text: 'Подготовка к экзамену по математике завтра утром' }),
    'Подготовка к экзамену по математике завтра')
  assert.equal(createConversationTitle({ command: null, text: 'Расписание' }), 'Расписание')
})

test('limits titles to 60 characters, including long words and suggestion clarification', () => {
  const longWord = 'У'.repeat(100)
  assert.equal(createConversationTitle({ command: null, text: longWord }), 'У'.repeat(60))
  const title = createConversationTitle({ command: 'Моя неделя', text: longWord })
  assert.ok(title.startsWith('Моя неделя У'))
  assert.equal(Array.from(title).length, 60)
  assert.equal(title, title.trim())
})

test('preserves Unicode characters and meaningful symbols without technical or generic fallback names', () => {
  assert.equal(createConversationTitle({ command: null, text: '🙂'.repeat(70) }), '🙂'.repeat(60))
  assert.equal(createConversationTitle({ command: null, text: '???' }), '???')
  assert.equal(createConversationTitle({ command: null, text: '' }), '')
})

test('generates the same result for the same input', () => {
  const draft = { command: 'Моя неделя', text: 'практики после обеда' }
  assert.equal(createConversationTitle(draft), createConversationTitle(draft))
})
