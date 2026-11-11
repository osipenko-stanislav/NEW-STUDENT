import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createMockResponse } from '../src/lib/mock-assistant.ts'
import { isGenerativePart } from '../src/lib/assistant-validation.ts'
import { demoAssignments, demoClasses, demoDays, demoMaterials, demoToday, demoTomorrow } from '../src/data/study-demo.ts'
import { homeworkDeadlines, upcomingClassSlots } from '../src/data/study-widgets.ts'
import type { ChatMessage, MessagePart } from '../src/types/conversation.ts'

const response = (command: string | null, text = '', history: ChatMessage[] = []) => createMockResponse({ command, text }, history)
const asHistory = (reply: ReturnType<typeof response>): ChatMessage[] => [{ id: 'assistant', role: 'assistant', createdAt: 1, ...reply }]
function block(reply: ReturnType<typeof response>) { return reply.content.find(part => part.type !== 'text') }
const text = (parts: MessagePart[]) => parts.filter(part => part.type === 'text').map(part => part.text).join(' ')

test('all four commands return validated serializable blocks and contextual suggestions', () => {
  for (const [command, type] of [['Расписание сегодня', 'schedule'], ['Моя неделя', 'schedule'], ['Домашки', 'assignments'], ['Материалы', 'materials']]) {
    const reply = response(command)
    assert.equal(block(reply)?.type, type)
    assert.equal(isGenerativePart(JSON.parse(JSON.stringify(block(reply)))), true)
    assert.ok(text(reply.content).length > 30)
    assert.ok(reply.suggestions.length >= 2 && reply.suggestions.length <= 3)
    assert.deepEqual(reply, response(command))
  }
})

test('tomorrow and homework refinements use the current conversation context', () => {
  const today = response('Расписание сегодня')
  const tomorrow = block(response(null, 'А что у меня завтра?', asHistory(today)))
  assert.equal(tomorrow?.type, 'schedule')
  if (tomorrow?.type === 'schedule') assert.equal(tomorrow.selectedDay, demoTomorrow)
  const week = response('Моя неделя')
  const deadlines = block(response(null, 'Покажи только домашки', asHistory(week)))
  if (deadlines?.type !== 'schedule') assert.fail('Expected weekly deadlines')
  assert.equal(deadlines.mode, 'week')
  assert.equal(deadlines.view, 'deadlines')
  const assignments = block(response(null, 'А что у меня завтра?', asHistory(response('Домашки'))))
  if (assignments?.type !== 'assignments') assert.fail('Expected tomorrow assignments')
  assert.deepEqual(assignments.items.map(item => item.id), ['python-functions'])
})

test('command plus clarification applies the requested initial filter', () => {
  const weekly = block(response('Моя неделя', 'покажи только домашки'))
  assert.equal(weekly?.type === 'schedule' && weekly.view, 'deadlines')
  const math = block(response('Материалы', 'по математике'))
  assert.equal(math?.type === 'materials' && math.subject, 'math')
  const submitted = block(response('Домашки', 'покажи сданные'))
  assert.equal(submitted?.type === 'assignments' && submitted.filter, 'submitted')
})

test('nearest deadline excludes submitted work and respects the current subject', () => {
  const nearest = block(response(null, 'Какая ближайшая сдача?'))
  if (nearest?.type !== 'assignments') assert.fail('Expected assignment')
  assert.deepEqual(nearest.items.map(item => item.id), ['linear-equations'])
  const python = response('Домашки', 'по Python')
  const result = block(response(null, 'Какая ближайшая сдача?', asHistory(python)))
  if (result?.type !== 'assignments') assert.fail('Expected assignment')
  assert.deepEqual(result.items.map(item => item.id), ['python-functions'])
})

test('unsupported requests remain honest, retain context, and never analyze attachments', () => {
  const week = response('Моя неделя')
  const unknown = response(null, 'Запиши меня на пару и отправь письмо', asHistory(week))
  assert.equal(block(unknown), undefined)
  assert.match(text(unknown.content), /сценарий пока/)
  assert.deepEqual(unknown.mockContext, week.mockContext)
  const files = createMockResponse({ command: null, text: 'Проанализируй этот PDF', attachments: [{ materialId: 'file', name: 'file.pdf' }] })
  assert.match(text(files.content), /анализировать/)
  assert.equal(block(files), undefined)
  const badClarification = response('Домашки', 'сделай за меня все задания')
  assert.equal(block(badClarification), undefined)
})

test('widgets and assistant share classes, deadlines and one coherent demonstration week', () => {
  assert.equal(homeworkDeadlines, demoAssignments)
  assert.deepEqual(upcomingClassSlots, demoClasses.filter(item => item.date >= demoToday).slice(0, 4))
  const dates = new Set(demoDays.map(day => day.date))
  assert.ok(demoClasses.every(item => dates.has(item.date)))
  assert.ok(demoAssignments.every(item => dates.has(item.dueAt.slice(0, 10))))
  assert.ok(demoMaterials.every(item => demoClasses.some(slot => slot.course === item.course)))
  assert.equal(demoClasses.filter(item => item.date === demoToday).length, 2)
  assert.equal(demoClasses.filter(item => item.date === demoTomorrow).length, 2)
})

test('validators reject malformed blocks before history reaches UI', () => {
  assert.equal(isGenerativePart({ type: 'schedule', version: 2 }), false)
  const part = block(response('Моя неделя'))!
  assert.equal(isGenerativePart({ ...part, selectedDay: 'invalid' }), false)
  assert.equal(isGenerativePart({ ...part, classes: [{ id: 'broken' }] }), false)
  assert.equal(isGenerativePart({ type: 'materials', version: 1, query: '', subject: 'all', fileType: 'HTML', items: [] }), false)
})

test('explicit material searches switch scenarios while subject refinements retain context', () => {
  const mathHomework = response('Домашки', 'по математике')
  const materialSearch = block(response(null, 'Найди материалы по математике', asHistory(mathHomework)))
  assert.equal(materialSearch?.type, 'materials')
  const tomorrow = response(null, 'А что у меня завтра?', asHistory(mathHomework))
  assert.match(text(tomorrow.content), /заданий.*нет/)
  const tomorrowBlock = block(tomorrow)
  assert.equal(tomorrowBlock?.type === 'assignments' && tomorrowBlock.items.length, 0)
})
