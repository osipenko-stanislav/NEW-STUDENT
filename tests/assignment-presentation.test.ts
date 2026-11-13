import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assignmentStatuses, assignmentVariants, isAssignmentOverdue } from '../src/lib/assignment-presentation.ts'

test('does not present work sent for review as accepted or successful', () => {
  assert.equal(assignmentStatuses.submitted, 'На проверке')
  assert.equal(assignmentVariants.submitted, 'active')
})

test('marks old unsent deadlines, while keeping the fixed demo day and submitted work consistent', () => {
  assert.equal(isAssignmentOverdue('2026-11-10T23:59:00+03:00', 'in-progress'), true)
  assert.equal(isAssignmentOverdue('2026-11-11T23:59:00+03:00', 'new'), false)
  assert.equal(isAssignmentOverdue('2026-11-12T18:00:00+03:00', 'new'), false)
  assert.equal(isAssignmentOverdue('2026-11-10T23:59:00+03:00', 'submitted'), false)
})
