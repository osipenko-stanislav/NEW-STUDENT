import assert from 'node:assert/strict'
import { test } from 'node:test'
import { forecastWorks, calculateForecast } from '../src/lib/grade-forecast.ts'
const formula = [{ id: 'a', title: 'Работы', weight: 100, average: 6, total: 2 }]
const tasks = [{ id: '1', title: 'A', activityId: 'a', grade: 6, status: 'accepted' }, { id: '2', title: 'B', activityId: 'a', grade: null, status: 'new' }]
test('weighted contribution, maximum, expected results and impossible target', () => {
 const works = forecastWorks(formula, tasks)!
 const result = calculateForecast(works, { '2': 8 }, 9)
 assert.equal(result.current, 3); assert.equal(result.maximum, 8); assert.equal(result.projected, 7); assert.equal(result.required, 12); assert.equal(result.reachable, false)
 assert.equal(calculateForecast(works, {}, 7).required, 8)
 assert.equal(tasks[1].grade, null)
})
test('zero weights and no grades do not divide by zero', () => {
 const works = forecastWorks([{ ...formula[0], weight: 0 }], tasks)!
 assert.equal(calculateForecast(works, {}, 1).required, null)
 assert.equal(calculateForecast(works, {}, 1).reachable, false)
 const none = forecastWorks(formula, tasks.map(t => ({ ...t, grade: null, status: 'new' })))!
 assert.equal(calculateForecast(none, {}, 8).current, 0)
 assert.equal(calculateForecast(none, {}, 8).maximum, 10)
})
test('completed course has a fixed result', () => {
 const works = forecastWorks(formula, tasks.map(t => ({ ...t, grade: 6, status: 'accepted' })))!
 const result = calculateForecast(works, {}, 6)
 assert.equal(result.remaining.length, 0); assert.equal(result.current, result.maximum); assert.equal(result.achieved, true)
})
test('incomplete or inconsistent data is unavailable, never silently normalized', () => {
 assert.equal(forecastWorks([], tasks), null)
 assert.equal(forecastWorks(formula, tasks.slice(0, 1)), null)
 assert.equal(forecastWorks([{ ...formula[0], total: 0 }], tasks), null)
 assert.equal(forecastWorks([{ ...formula[0], weight: -1 }], tasks), null)
 assert.equal(forecastWorks(formula, [{ ...tasks[0], grade: null }, tasks[1]]), null)
 assert.equal(forecastWorks(formula, [{ ...tasks[0], grade: 11 }, tasks[1]]), null)
 const works = forecastWorks([{ ...formula[0], weight: 120 }], tasks)!
 assert.equal(calculateForecast(works, {}, 10).maximum, 9.6)
})

test('forecast fixtures add multiple course works without changing recorded coursework', async () => {
 const { academicTasks, gradeStatements } = await import('../src/data/academic-data.ts')
 const original = JSON.stringify({ academicTasks, gradeStatements })
 const { forecastScenarios } = await import('../src/data/forecast-scenarios.ts')
 assert.ok(forecastScenarios.length > 1)
 for (const scenario of forecastScenarios) {
   const works = forecastWorks(scenario.formula, scenario.tasks)
   assert.ok(works, scenario.id)
   assert.ok(works.filter(work => work.grade === null).length >= 3, scenario.id)
   const source = gradeStatements.find(statement => statement.id === scenario.id)!
   assert.deepEqual(scenario.formula.map(row => row.weight), source.formula!.map(row => row.weight))
   for (const task of academicTasks.filter(task => task.enrollmentId === scenario.id)) assert.equal(scenario.tasks.find(work => work.id === task.id)?.grade, task.grade)
   const expected = Object.fromEntries(works.filter(work => work.grade === null).map(work => [work.id, 10]))
   const result = calculateForecast(works, expected, 8)
   assert.ok(Math.abs(result.projected - result.maximum) < 1e-9)
 }
 assert.equal(JSON.stringify({ academicTasks, gradeStatements }), original)
})
