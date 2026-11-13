import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addDays, weekDays, layoutCalendarEntries, filterClasses, moscowDate } from '../src/lib/schedule.ts'
import { matchesHomeworkFilter } from '../src/lib/homework-filters.ts'
import { academicTasks, academicClasses } from '../src/data/academic-data.ts'
import { isHomework } from '../src/lib/academic-presentation.ts'

test('calendar weeks cross months, years and Sunday boundaries', () => {
  assert.deepEqual(weekDays('2027-01-03'), ['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03'])
  assert.equal(addDays('2028-02-28', 2), '2028-03-01')
  assert.equal(moscowDate(new Date('2026-11-11T22:30:00Z')), '2026-11-12')
})
test('overlap lanes retain transitive overlaps and reuse space after the group', () => {
  const entries = [{id:'a',startsAt:'09:00',endsAt:'12:00'}, {id:'b',startsAt:'09:30',endsAt:'10:00'}, {id:'c',startsAt:'10:00',endsAt:'11:00'}, {id:'d',startsAt:'12:00',endsAt:'13:00'}]
  assert.deepEqual(layoutCalendarEntries(entries).map(({entry,lane,lanes})=>[entry.id,lane,lanes]), [['a',0,2],['b',1,2],['c',1,2],['d',0,1]])
})
test('schedule filters intersect instead of broadening the selection', () => {
  const slot=academicClasses[0]
  assert.ok(filterClasses(academicClasses,{course:slot.courseId!,format:slot.format,room:slot.room,teacher:slot.teacher}).some(item=>item.id===slot.id))
  assert.deepEqual(filterClasses(academicClasses,{course:slot.courseId!,format:'missing',room:slot.room,teacher:slot.teacher}),[])
})
test('global and chat filters partition new, ongoing, handed-in and reviewed homework', () => {
  for (const task of academicTasks.filter(isHomework)) {
    assert.equal(matchesHomeworkFilter(task.status,'active'),!matchesHomeworkFilter(task.status,'submitted'))
    assert.equal(['new','in-progress','submitted'].filter(filter=>matchesHomeworkFilter(task.status,filter as 'new'|'in-progress'|'submitted')).length,1)
  }
  assert.ok(matchesHomeworkFilter('accepted','submitted'))
  assert.ok(matchesHomeworkFilter('rejected','in-progress'))
})
