import { test } from 'node:test'
import assert from 'node:assert/strict'
import { singleFilter } from '../src/lib/filters.ts'

test('external destinations replace legacy filter context; section transitions preserve explicit predicates', async () => {
  const history = {
    state: {} as Record<string, any>,
    replaceState(state: Record<string, any>) { this.state = state },
    pushState(state: Record<string, any>) { this.state = state },
  }
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { history, location: { href: 'http://localhost:5173/' }, addEventListener() {} } })
  try {
    const { navigate } = await import('../src/hooks/use-navigation.ts')
    const predicates = singleFilter('course', 'python')
    navigate({ homeworkConditions: predicates, scheduleConditions: predicates })
    navigate({ section: 'Домашки' })
    assert.deepEqual(history.state.studentNavigation.homeworkConditions, predicates)
    navigate({ homeworkFilter: 'active', homeworkCourse: 'math' })
    assert.equal(history.state.studentNavigation.homeworkConditions, undefined)
    navigate({ scheduleKind: 'classes' })
    assert.deepEqual(history.state.studentNavigation.scheduleConditions, predicates)
    navigate({ scheduleCourse: 'all' })
    assert.equal(history.state.studentNavigation.scheduleConditions, undefined)
    navigate({ homeworkFilter: 'all', homeworkConditions: predicates })
    assert.deepEqual(history.state.studentNavigation.homeworkConditions, predicates)
    navigate({ homeworkScope: 'archive', homeworkConditions: predicates })
    navigate({ section: 'Домашки' })
    assert.equal(history.state.studentNavigation.homeworkScope, 'archive')
    navigate({ homeworkFilter: 'active' })
    assert.equal(history.state.studentNavigation.homeworkScope, 'current')
    navigate({ courseId: 'python-basic', courseEnrollmentId: 'archive-python-basic' })
    navigate({ taskId: 'archive-task' })
    assert.equal(history.state.studentNavigation.courseEnrollmentId, 'archive-python-basic')
    navigate({ courseId: 'python-basic', taskId: null })
    assert.equal(history.state.studentNavigation.courseEnrollmentId, null)
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})
