import assert from 'node:assert/strict'
import test from 'node:test'
import { createNotifications } from '../src/data/notifications.ts'
import { filterNotifications, initialNotifications, notificationDetails, notificationGroupLabel, notificationRelativeTime, parseNotificationState } from '../src/lib/notifications.ts'
import { academicClasses, academicTasks } from '../src/data/academic-data.ts'
const now = Date.parse('2026-11-13T12:00:00+03:00')
const events = createNotifications(now)
test('all notification destinations resolve existing entities and event history is ordered and stable', () => {
  assert.equal(events.length, 18)
  assert.equal(new Set(events.map(event => event.id)).size, 18)
  assert.deepEqual(events.map(event => event.createdAt), events.map(event => event.createdAt).sort().reverse())
  for (const event of events) {
    const details = notificationDetails(event)
    assert(details)
    if (event.target.kind === 'task') {
      const task = academicTasks.find(task => task.id === event.target.id)!
      assert.equal(details.destination.taskId, task.id)
      assert.equal(details.destination.courseId, task.courseId)
      if (event.type === 'reviewed') assert(details.description.includes(String(task.grade)))
    }
    if (event.target.kind === 'class') {
      const slot = academicClasses.find(slot => slot.id === event.target.id)!
      assert.equal(details.destination.scheduleEventId, slot.id)
      assert.equal(details.destination.scheduleDate, slot.date)
      assert.equal(details.destination.scheduleView, 'day')
    }
  }
})
test('importance intersects categories and unread filtering never changes events', () => {
  const read = new Set([events[0].id])
  const important = filterNotifications(events, read, 'important', false)
  assert(important.some(event => event.category === 'learning'))
  assert(important.some(event => event.category === 'events'))
  assert(important.every(event => event.important))
  assert.equal(filterNotifications(events, read, 'all', true).length, 17)
  assert.equal(filterNotifications(events, new Set(events.map(event => event.id)), 'all', true).length, 0)
  assert.equal(filterNotifications(events, read, 'goals', false).length, 0)
  assert.equal(events.length, 18)
})
test('local state preserves anchor and read IDs, rejects corrupt data and removes unknown IDs', () => {
  const initial = initialNotifications(now)
  assert.equal(initial.readIds.length, 11)
  const saved = JSON.stringify({ version: 1, anchor: now, readIds: [events[0].id, events[0].id, 'invalid', 42] })
  assert.deepEqual(parseNotificationState(saved, now + 86400000), { anchor: now, readIds: [events[0].id] })
  for (const invalid of ['{', 'null', '{"version":1,"anchor":1,"readIds":{}}', JSON.stringify({ version: 1, anchor: now + 90000, readIds: [] })]) assert.deepEqual(parseNotificationState(invalid, now), initial)
})
test('relative times clamp future events and grouping follows the Moscow date boundary', () => {
  assert.equal(notificationRelativeTime(new Date(now + 60000).toISOString(), now), 'Только что')
  assert.equal(notificationGroupLabel('2026-11-12T22:00:00Z', now), 'Сегодня')
  assert.equal(notificationGroupLabel('2026-11-12T20:00:00Z', now), 'Вчера')
})
