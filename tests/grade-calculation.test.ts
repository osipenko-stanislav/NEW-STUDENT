import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateGrade, formatGrade, weightedGrade } from '../src/lib/grade-calculation.ts'
import { deepLearningFormula, statisticsFormula } from '../src/data/grades.ts'

test('recalculates source totals without normalizing incomplete weights', () => {
  assert.equal(weightedGrade(8, 10), 0.8)
  assert.deepEqual(calculateGrade(deepLearningFormula), { raw: 2.98, rounded: 3, weight: 77 })
})
test('adds bonus weights beyond 100 percent', () => {
  assert.deepEqual(calculateGrade([{ average: 8, weight: 100 }, { average: 5, weight: 20 }]), { raw: 9, rounded: 9, weight: 120 })
  assert.deepEqual(calculateGrade(statisticsFormula), { raw: 0, rounded: 0, weight: 120 })
})
test('sums fractional contributions before rounding the course grade', () => {
  assert.deepEqual(calculateGrade([{ average: 1, weight: 25 }, { average: 1, weight: 25 }]), { raw: 0.5, rounded: 1, weight: 50 })
  assert.equal(calculateGrade([{ average: 4.49, weight: 100 }]).rounded, 4)
  assert.equal(calculateGrade([{ average: 4.5, weight: 100 }]).rounded, 5)
})
test('formats missing values separately from zero and localizes decimals', () => {
  assert.equal(formatGrade(null), '—')
  assert.equal(formatGrade(0), '0')
  assert.equal(formatGrade(2.98), '2,98')
})
