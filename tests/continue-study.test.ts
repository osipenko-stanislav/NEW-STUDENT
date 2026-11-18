import assert from 'node:assert/strict'
import { test } from 'node:test'
import { academicTasks, gradeStatements } from '../src/data/academic-data.ts'
import { continueStudyActions, continueStudyReason } from '../src/lib/continue-study.ts'
import { createMockResponse } from '../src/lib/mock-assistant.ts'
import { isGenerativePart } from '../src/lib/assistant-validation.ts'
import { resolveStudyPart } from '../src/lib/study-projections.ts'
import { emptyHomework } from '../src/lib/homework-storage.ts'
import type { LateDaysState } from '../src/data/late-days.ts'
const state: LateDaysState = { version: 1, operations: [] }
const pending = academicTasks.filter(task => task.enrollmentId.startsWith('current-') && task.grade === null && task.status !== 'submitted')

test('continue command and typed request share a validated restorable assignments block', () => {
 const command = createMockResponse({ text: '', command: 'Продолжить учёбу' })
 assert.deepEqual(command, createMockResponse({ text: 'Продолжить учебу', command: null }))
 const part = command.content.find(part => part.type === 'assignments')!
 assert.equal(part.presentation, 'continue-study'); assert.ok(part.items.length <= 3 && part.items.length > 0)
 assert.equal(isGenerativePart(JSON.parse(JSON.stringify(part))), true)
 assert.deepEqual(resolveStudyPart(part), part)
 assert.equal(isGenerativePart({ ...part, presentation: 'unknown' }), false)
})
test('selects unfinished current tasks by actual deadline and excludes submitted, accepted and archived', () => {
 const selected = continueStudyActions(academicTasks, {}, state)
 assert.ok(selected.length <= 3)
 for(const action of selected) assert.ok(action.task.grade === null && action.task.enrollmentId.startsWith('current-') && action.status !== ('submitted' as string))
 assert.ok(selected.every((action, index) => !index || action.deadline >= selected[index - 1].deadline))
 const records = Object.fromEntries(pending.map(task => [task.id, { ...emptyHomework(), submittedAt: 1 }]))
 assert.deepEqual(continueStudyActions(academicTasks, records, state), [])
 assert.deepEqual(continueStudyActions([], {}, state), [])
 const reply = createMockResponse({text:'Продолжить учёбу',command:null}, [], {state, records})
 const block = reply.content.find(part => part.type === 'assignments')!
 assert.equal(block.items.length,0)
})
test('deadline extensions and current saved state update selection without changing coursework', () => {
 const original = JSON.stringify(academicTasks)
 const selected = continueStudyActions(academicTasks, {}, state)
 const first = selected[0].task
 const extended: LateDaysState = {version:1,operations:[{id:'op',batchId:'batch',semesterId:'autumn-2026',taskId:first.id,type:'debit',days:10,at:'2026-11-11T12:00:00+03:00',originalDeadline:first.dueAt,beforeDeadline:first.dueAt,newDeadline:'2026-12-01T23:59:00+03:00',status:'applied'}]}
 assert.notEqual(continueStudyActions(academicTasks, {}, extended)[0].task.id,first.id)
 const only = continueStudyActions([first], {[first.id]:{...emptyHomework(),savedAt:1}},state)[0]
 assert.equal(only.status,'in-progress')
 assert.equal(JSON.stringify(academicTasks),original)
})
test('known weights break equal deadlines; unknown deadlines remain explicit', () => {
 const tasks = pending.filter(task => gradeStatements.find(s=>s.id===task.enrollmentId)?.formula?.some(row=>row.id===task.activityId)).slice(0,4).map(task=>({...task,dueAt:'2026-11-12T23:59:00+03:00'}))
 const selected = continueStudyActions(tasks,{},state)
 assert.ok(selected.every((a,i)=>!i || a.weight<=selected[i-1].weight))
 const missing = continueStudyActions([{...tasks[0],dueAt:''}],{},state)[0]
 assert.equal(missing.dueAt,null); assert.match(continueStudyReason(missing),/Срок не указан/)
 const overdue = continueStudyActions([{...tasks[0],dueAt:'2026-11-01T23:59:00+03:00'}],{},state)[0]
 assert.match(continueStudyReason(overdue),/уже прошел/)
})
