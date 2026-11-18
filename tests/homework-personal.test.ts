import assert from 'node:assert/strict'
import { test } from 'node:test'
import { academicTasks, assistantAssignments, academicClasses, gradeStatements } from '../src/data/academic-data.ts'
import { emptyHomework, canSkipHomework, isHomeworkSkipped, homeworkStatus, parseHomeworkRecords } from '../src/lib/homework-storage.ts'
import { matchesHomeworkFilter } from '../src/lib/homework-filters.ts'
import { continueStudyActions } from '../src/lib/continue-study.ts'
import { dayStudyLoad } from '../src/lib/week-plan.ts'
import { resolveHomeworkAssignment, resolveStudyPart } from '../src/lib/study-projections.ts'
import { createMockResponse } from '../src/lib/mock-assistant.ts'
import { isGenerativePart } from '../src/lib/assistant-validation.ts'
import { seedLateDays } from '../src/data/late-days.ts'
import { lateDaysBalance, taskDeadline, burningTasks, lateDaysReason, applyLateDaysPlan } from '../src/lib/late-days.ts'
const task = academicTasks.find(task => canSkipHomework(task))!
const record = { ...emptyHomework(), skipped: true }
const records = { [task.id]: record }
const state = seedLateDays()
test('personal decision persists separately and ignores stale flags on finished, graded or archived work', () => {
  assert.deepEqual(parseHomeworkRecords(JSON.stringify(records)), records)
  assert.equal(parseHomeworkRecords(JSON.stringify({ [task.id]: { ...record, skipped: 'yes' } }))[task.id], undefined)
  assert.equal(isHomeworkSkipped(task, record), true)
  assert.equal(homeworkStatus(task, record), task.status)
  for (const changed of [{ ...task, status: 'accepted' as const }, { ...task, status: 'submitted' as const }, { ...task, grade: 0 }, { ...task, enrollmentId: 'archive' }]) {
    assert.equal(canSkipHomework(changed, record), false)
    assert.equal(isHomeworkSkipped(changed, record), false)
  }
  assert.equal(isHomeworkSkipped(task, { ...record, submittedAt: 1 }), false)
  assert.equal(isHomeworkSkipped(task, { ...record, skipped: undefined }), false)
  assert.equal(isHomeworkSkipped({ ...task, status: 'rejected', grade: null }, record), true)
})
test('all and personal filters preserve skipped objects; active filters exclude them', () => {
  assert.equal(matchesHomeworkFilter(task.status, 'all', true), true)
  assert.equal(matchesHomeworkFilter(task.status, 'skipped', true), true)
  assert.equal(matchesHomeworkFilter(task.status, 'active', true), false)
  assert.equal(matchesHomeworkFilter('new', 'new', true), false)
  assert.equal(matchesHomeworkFilter(task.status, 'skipped', false), false)
})
test('navigator all/skipped lists validate and active/nearest/continue recommendations exclude personal skips', () => {
  const allRecords = Object.fromEntries(academicTasks.filter(task => canSkipHomework(task)).map(task => [task.id, record]))
  for (const query of ['Покажи все задания включая пропущенные', 'Покажи пропущенные', 'Покажи несданные', 'Какая ближайшая сдача?']) {
    const reply = createMockResponse({text:query,command:null}, [], {state,records:allRecords})
    const part = reply.content.find(part => part.type === 'assignments')!
    assert.ok(part);assert.equal(isGenerativePart(part), true)
    if (part.filter === 'all' || part.filter === 'skipped') assert.ok(part.items.some(item => item.personalSkipped))
    else if (query.includes('ближайшая')) assert.equal(part.items.length, 0)
  }
  assert.deepEqual(continueStudyActions(academicTasks, allRecords, state), [])
  const item = assistantAssignments.find(item => item.id === task.id)!
  const restored = resolveStudyPart({ type:'assignments',version:1,items:[{...item,personalSkipped:false}],filter:'all',subject:'all' })
  assert.equal(restored.type, 'assignments')
  if (restored.type === 'assignments') assert.equal(resolveHomeworkAssignment(restored.items[0], records).personalSkipped, true)
  assert.equal(resolveHomeworkAssignment(item, {}).personalSkipped, false)
})
test('load excludes personal deadlines and preparation while official records and Late Days stay unchanged', () => {
  const before = JSON.stringify({academicTasks,gradeStatements,state})
  const item = resolveHomeworkAssignment(assistantAssignments.find(item => item.id === task.id)!,records)
  const block = { id:'prep',week:task.dueAt.slice(0,10),taskId:task.id,day:task.dueAt.slice(0,10),minutes:60,done:false }
  const load = dayStudyLoad(block.day, academicClasses, [item], [block])
  assert.equal(load.deadlines, 0);assert.equal(load.personalMinutes, 0)
  const returned = dayStudyLoad(block.day, academicClasses, [resolveHomeworkAssignment(item,{})], [block])
  assert.equal(returned.deadlines, 1);assert.equal(returned.personalMinutes, 60)
  assert.ok(!burningTasks(state,records).some(item=>item.id===task.id))
  assert.match(lateDaysReason(task,state,records)!,/Пропущено мной/)
  assert.equal(applyLateDaysPlan(state,[{taskId:task.id,days:1,expectedDeadline:taskDeadline(state,task)}],'skipped',records).state,state)
  assert.deepEqual(lateDaysBalance(state),lateDaysBalance(JSON.parse(JSON.stringify(state))))
  assert.equal(JSON.stringify({academicTasks,gradeStatements,state}),before)
})
