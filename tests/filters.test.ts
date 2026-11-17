import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchesFilters, singleFilter, type FilterCondition, type FilterOperator } from '../src/lib/filters.ts'
import { assignmentStatusConditions } from '../src/lib/study-filters.ts'
const clause = (operator: FilterOperator | null, values: string[] = ['a'], field = 'status'): FilterCondition => ({ id: 'test', field, operator, values })
test('all six operators distinguish membership, exclusion and missing values', () => {
  assert.equal(matchesFilters({ status: 'a' }, [clause('is')]), true)
  assert.equal(matchesFilters({ status: 'b' }, [clause('is')]), false)
  assert.equal(matchesFilters({ status: 'b' }, [clause('is-not')]), true)
  assert.equal(matchesFilters({ status: 'a' }, [clause('is-not')]), false)
  assert.equal(matchesFilters({ status: ['b', 'c'] }, [clause('any-of', ['a', 'c'])]), true)
  assert.equal(matchesFilters({ status: ['b', 'c'] }, [clause('none-of', ['a', 'c'])]), false)
  assert.equal(matchesFilters({ status: 'b' }, [clause('none-of', ['a', 'c'])]), true)
  for (const status of [null, undefined, '', []]) {
    assert.equal(matchesFilters({ status }, [clause('empty')]), true)
    assert.equal(matchesFilters({ status }, [clause('not-empty')]), false)
  }
  assert.equal(matchesFilters({ status: ['a'] }, [clause('empty')]), false)
  assert.equal(matchesFilters({ status: ['a'] }, [clause('not-empty')]), true)
})
test('conditions intersect; drafts do not filter and unknown fields do not silently match', () => {
  const conditions = [clause('any-of', ['a', 'b']), clause('is-not', ['x'], 'course')]
  assert.equal(matchesFilters({ status: 'b', course: 'y' }, conditions), true)
  assert.equal(matchesFilters({ status: 'b', course: 'x' }, conditions), false)
  assert.equal(matchesFilters({ status: 'c', course: 'y' }, conditions), false)
  assert.equal(matchesFilters({ status: 'c' }, [clause(null), clause('is', [])]), true)
  assert.equal(matchesFilters({}, [clause('empty')]), false)
  assert.equal(matchesFilters({}, []), true)
})
test('legacy presets retain all/active semantics and exact course context', () => {
  assert.deepEqual(singleFilter('course', 'all'), [])
  const active = assignmentStatusConditions('active')
  for (const status of ['new', 'in-progress']) assert.equal(matchesFilters({ status }, active), true)
  assert.equal(matchesFilters({ status: 'submitted' }, active), false)
  assert.equal(matchesFilters({ status: 'new', course: 'python' }, [...active, ...singleFilter('course', 'math')]), false)
})
