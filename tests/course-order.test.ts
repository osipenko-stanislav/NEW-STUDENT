import assert from 'node:assert/strict'
import { test } from 'node:test'
import { courseOrderStorageKey, loadCourseOrder, moveCourse, normalizeCourseOrder, saveCourseOrder } from '../src/lib/course-order.ts'

const ids = ['a', 'b', 'c', 'd']
test('restores known courses once and appends courses added after the saved order', () => {
  assert.deepEqual(normalizeCourseOrder(['c', 'deleted', 'c', 'a', 3], ids), ['c', 'a', 'b', 'd'])
  assert.deepEqual(normalizeCourseOrder(null, ids), ids)
})
test('moves courses before or after a target while preserving all other positions', () => {
  assert.deepEqual(moveCourse(ids, 'd', 'b'), ['a', 'd', 'b', 'c'])
  assert.deepEqual(moveCourse(ids, 'a', 'c', true), ['b', 'c', 'a', 'd'])
  assert.deepEqual(moveCourse(ids, 'a', 'a'), ids)
  assert.deepEqual(moveCourse(ids, 'missing', 'a'), ids)
  assert.deepEqual(ids, ['a', 'b', 'c', 'd'])
})
test('reordering filtered courses retains hidden courses and the global order', () => {
  // b and d are hidden by the active category.
  const next = moveCourse(ids, 'c', 'a')
  assert.deepEqual(next.filter(id => ['a', 'c'].includes(id)), ['c', 'a'])
  assert.deepEqual(next.filter(id => ['b', 'd'].includes(id)), ['b', 'd'])
  assert.deepEqual([...next].sort(), [...ids].sort())
})
test('persists order and recovers gracefully from invalid or inaccessible storage', () => {
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } })
  saveCourseOrder(['d', 'b', 'a', 'c'])
  assert.deepEqual(loadCourseOrder(ids), { order: ['d', 'b', 'a', 'c'], error: null })
  for (const raw of ['{', '{}', '[1]']) {
    values.set(courseOrderStorageKey, raw)
    assert.deepEqual(loadCourseOrder(ids).order, ids)
    assert.ok(loadCourseOrder(ids).error)
    assert.equal(values.get(courseOrderStorageKey), raw)
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('Blocked') } })
  assert.ok(loadCourseOrder(ids).error)
  assert.throws(() => saveCourseOrder(ids))
  Reflect.deleteProperty(globalThis, 'localStorage')
})
