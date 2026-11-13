import assert from 'node:assert/strict'
import test from 'node:test'
import { academicTasks } from '../src/data/academic-data.ts'
import { currentLateDaysSemester, lateDaysPolicy, lateDaysSemesters, seedLateDays, shiftDeadline } from '../src/data/late-days.ts'
import { applyLateDaysPlan, burningTasks, lateDaysBalance, lateDaysMonths, lateDaysReason, parseLateDays, taskDeadline, type LateDaysPlanItem } from '../src/lib/late-days.ts'
import { createMockResponse } from '../src/lib/mock-assistant.ts'
import { emptyHomework } from '../src/lib/homework-storage.ts'
import { isGenerativePart } from '../src/lib/assistant-validation.ts'
const seed = seedLateDays()
const tasks = burningTasks(seed, {})
const planFor = (index = 0, days = 1): LateDaysPlanItem => ({ taskId: tasks[index].id, days, expectedDeadline: taskDeadline(seed, tasks[index]) })
test('balance, cumulative columns and grants are derived from operations without future spending', () => {
  assert.deepEqual(lateDaysBalance(seed), { limit: 24, used: 9, remaining: 15 })
  const months = lateDaysMonths(seed, currentLateDaysSemester)
  assert.deepEqual(months.map(month => [month.used, month.remaining]), [[2, 22], [6, 18], [9, 15]])
  assert.equal(months.at(-1)!.id, '2026-11')
  const archive = lateDaysSemesters.find(item => item.id === 'spring-2026')!
  const archivedMonths = lateDaysMonths(seed, archive)
  assert.equal(archivedMonths[0].limit, 20)
  assert.equal(archivedMonths[1].limit, 22)
  assert.deepEqual(lateDaysBalance(seed, archive), { limit: 22, used: 7, remaining: 15 })
  assert(archivedMonths.every(month => month.used + month.remaining === month.limit))
})
test('single transfer preserves Moscow time and retries never debit twice', () => {
  assert(tasks.length > 0)
  const result = applyLateDaysPlan(seed, [planFor()], 'transfer-one', {})
  assert(!result.error)
  assert.equal(lateDaysBalance(result.state).remaining, 14)
  assert.equal(taskDeadline(result.state, tasks[0]), shiftDeadline(tasks[0].dueAt, 1))
  assert.equal(taskDeadline(result.state, tasks[0]).slice(11), tasks[0].dueAt.slice(11))
  assert.equal(applyLateDaysPlan(result.state, [planFor()], 'transfer-one', {}).state, result.state)
  const next = applyLateDaysPlan(result.state, [{ taskId: tasks[0].id, days: 2, expectedDeadline: taskDeadline(result.state, tasks[0]) }], 'transfer-two', {})
  assert.equal(lateDaysBalance(next.state).remaining, 12)
  assert.equal(taskDeadline(next.state, tasks[0]), shiftDeadline(tasks[0].dueAt, 3))
})
test('bulk transfer is all-or-nothing, rejects stale deadlines, duplicates and insufficient budget', () => {
  const valid = [planFor(0), planFor(1, 2)]
  assert.equal(lateDaysBalance(applyLateDaysPlan(seed, valid, 'bulk', {}).state).remaining, 12)
  const invalids = [[planFor(0), planFor(1, 20)], [planFor(0), { ...planFor(1), expectedDeadline: shiftDeadline(tasks[1].dueAt, 1) }], [planFor(), planFor()], [planFor(0, 1.5)], [planFor(0, 0)], [planFor(0, 1e12)]]
  for (const plan of invalids) {
    const result = applyLateDaysPlan(seed, plan, 'invalid', {})
    assert(result.error)
    assert.equal(result.state, seed)
    assert.equal(lateDaysBalance(seed).remaining, 15)
  }
})
test('eligibility excludes submitted, accepted, archived, timed and expired work', () => {
  const submitted = { ...emptyHomework(), submittedAt: Date.now() }
  assert.match(lateDaysReason(tasks[0], seed, { [tasks[0].id]: submitted })!, /Сданное/)
  assert(lateDaysReason(academicTasks.find(task => task.status === 'accepted')!, seed, {}))
  assert(lateDaysReason(academicTasks.find(task => task.enrollmentId.startsWith('archive-'))!, seed, {}))
  const timed = tasks.find(task => task.timeLimitMinutes)!
  assert.match(lateDaysReason(timed, seed, { [timed.id]: { ...emptyHomework(), startedAt: Date.now() } })!, /Таймер/)
  assert(lateDaysReason(tasks[0], seed, {}, Date.parse(tasks[0].dueAt) + 1))
  assert.equal(burningTasks(seed, {}, lateDaysPolicy.now + 30 * 86400000).length, 0)
  const result = applyLateDaysPlan(seed, [planFor(0), planFor(1)], 'no-partial', { [tasks[1].id]: submitted })
  assert(result.error); assert.equal(result.state, seed)
})
test('stored operations restore deadlines and reject broken chains, unknown IDs and corrupt data', () => {
  const result = applyLateDaysPlan(seed, [planFor(0, 3)], 'persist', {}).state
  assert.deepEqual(parseLateDays(JSON.stringify(result)), result)
  for (const mutate of [(s: typeof seed) => { s.operations[0].days = -3 }, (s: typeof seed) => { s.operations[0].newDeadline = 'invalid' }, (s: typeof seed) => { s.operations[0].taskId = 'missing' }, (s: typeof seed) => { s.operations.push(s.operations[0]) }]) {
    const copy = structuredClone(result); mutate(copy)
    assert.deepEqual(parseLateDays(JSON.stringify(copy)), seed)
  }
  assert.deepEqual(parseLateDays('{'), seed)
})
test('assistant proposes live plans and cannot spend days; persisted Gen UI blocks validate', () => {
  for (const query of ['Я в огне', 'У меня горят дедлайны', 'Перенеси всё на день', 'Помоги распределить Late Days', 'Сколько у меня осталось Late Days?', 'Покажи историю Late Days', 'Какие домашки я могу перенести?']) {
    const response = createMockResponse({ text: query, command: null }, [], { state: seed, records: {} })
    const part = response.content.find(part => part.type === 'late-days')!
    assert(isGenerativePart(part))
    assert.equal(lateDaysBalance(seed).remaining, 15)
  }
  const text = createMockResponse({ text: 'Я в огне', command: null }, [], { state: seed, records: {} }).content[0]
  assert(text.type === 'text' && text.text.startsWith('Брат, ща всё поправим!'))
  const exhausted = applyLateDaysPlan(seed, [planFor(0, 15)], 'empty-budget', {}).state
  const response = createMockResponse({ text: 'Я в огне', command: null }, [], { state: exhausted, records: {} })
  assert(response.content[0].type === 'text' && response.content[0].text.includes('закончились'))
})
test('normal assistant assignment replies project the same updated deadline', () => {
  const next = applyLateDaysPlan(seed, [planFor(0, 2)], 'normal-chat', {}).state
  const response = createMockResponse({ text: 'Домашки', command: null }, [], { state: next, records: {} })
  const part = response.content.find(part => part.type === 'assignments')
  assert(part?.type === 'assignments')
  assert.equal(part.items.find(item => item.id === tasks[0].id)?.dueAt, taskDeadline(next, tasks[0]))
})
