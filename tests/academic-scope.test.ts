import { test } from 'node:test'
import assert from 'node:assert/strict'
import { academicScope } from '../src/lib/academic-scope.ts'
import { enrollments, gradeStatements, tasksForCourse, statementForCourse } from '../src/data/academic-data.ts'

test('current semester, outside and archive are disjoint and cover every statement', () => {
  const groups = ['semester', 'outside', 'archive'].map(scope => gradeStatements.filter(item => academicScope(item) === scope))
  assert.equal(groups.flat().length, gradeStatements.length)
  assert.equal(new Set(groups.flat().map(item => item.id)).size, gradeStatements.length)
  assert.ok(groups[0].every(item => !item.archived && item.semester !== null))
  assert.ok(groups[1].every(item => !item.archived && item.semester === null))
  assert.deepEqual(groups[2].map(item => item.id), gradeStatements.filter(item => item.archived).map(item => item.id))
  assert.equal(academicScope({ archived: true, semester: null }), 'archive')
})
test('archive course uses tasks and grades of its enrollment without replacing current data', () => {
  for (const enrollment of enrollments.filter(item => item.archived)) {
    const archived = tasksForCourse(enrollment.courseId, enrollment.id)
    const current = tasksForCourse(enrollment.courseId)
    assert.ok(archived.length > 0)
    assert.ok(current.length > 0)
    assert.ok(archived.every(item => item.enrollmentId === enrollment.id))
    assert.ok(!archived.some(item => current.some(task => task.id === item.id)))
    assert.equal(statementForCourse(enrollment.courseId, enrollment.id).id, enrollment.id)
    assert.equal(statementForCourse(enrollment.courseId).archived, false)
  }
})
