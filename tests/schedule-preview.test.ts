import { test } from 'node:test'
import assert from 'node:assert/strict'
import { upcomingTodayEvents } from '../src/lib/schedule-preview.ts'
import { academicClasses, type AcademicTask } from '../src/data/academic-data.ts'

const slot = academicClasses[0]
const classes = [
  { ...slot, id: 'ended', date: '2026-11-12', startsAt: '08:00', endsAt: '09:00' },
  { ...slot, id: 'ongoing', date: '2026-11-12', startsAt: '09:00', endsAt: '10:00' },
  { ...slot, id: 'next', date: '2026-11-12', startsAt: '12:00', endsAt: '13:00' },
  { ...slot, id: 'tomorrow', date: '2026-11-13', startsAt: '09:00', endsAt: '10:00' },
]
const task = { id: 'deadline', title: 'Домашка', courseId: slot.courseId!, dueAt: '2026-11-12T11:00:00+03:00', status: 'new' as AcademicTask['status'] }

test('today preview orders ongoing classes, future classes and deadlines and excludes past events', () => {
  const now = new Date('2026-11-12T09:30:00+03:00')
  assert.deepEqual(upcomingTodayEvents(classes, [task, { ...task, id: 'overdue', dueAt: '2026-11-12T09:00:00+03:00' }], now).map(event => event.id), ['ongoing', 'deadline', 'next'])
})
test('today preview respects effective deadlines, submission and Moscow day boundaries', () => {
  const now = new Date('2026-11-12T00:10:00+03:00')
  const midnightTask = { ...task, dueAt: '2026-11-11T21:30:00Z' }
  assert.equal(upcomingTodayEvents([], [midnightTask], now).length, 1)
  for (const status of ['submitted', 'accepted'] as const) assert.deepEqual(upcomingTodayEvents([], [{ ...midnightTask, status }], now), [])
  assert.equal(upcomingTodayEvents([], [{ ...midnightTask, status: 'rejected' }], now).length, 1)
  assert.deepEqual(upcomingTodayEvents([], [{ ...task, dueAt: '2026-11-13T11:00:00+03:00' }], now), [])
  assert.deepEqual(upcomingTodayEvents(classes, [task], new Date('2026-11-12T23:59:59+03:00')), [])
})
