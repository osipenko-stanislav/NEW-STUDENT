import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync } from 'node:fs'
import { courses, featuredCourseId } from '../src/data/course-catalog.ts'
import { academicMaterials, academicTasks, enrollments, gradeStatements, assistantAssignments, assistantClasses, statementForCourse, materialsForCourse } from '../src/data/academic-data.ts'
import { courseInfo, courseAssignment, learningMaterials } from '../src/data/courses.ts'
import { calculateGrade } from '../src/lib/grade-calculation.ts'
import { createMockResponse } from '../src/lib/mock-assistant.ts'
import { resolveStudyPart } from '../src/lib/study-projections.ts'
import { searchItems } from '../src/data/search-items.ts'
import { isGenerativePart } from '../src/lib/assistant-validation.ts'

test('all sections use the 16-course handbook catalog without duplicate active statements', () => {
  const ids = new Set(courses.map(course => course.id))
  assert.equal(ids.size, 16)
  const current = gradeStatements.filter(statement => !statement.archived)
  assert.deepEqual(new Set(current.map(item => item.courseId)), ids)
  assert.equal(current.length, 16)
  for (const item of [...gradeStatements, ...assistantAssignments, ...academicMaterials, ...assistantClasses]) {
    assert.ok(ids.has(item.courseId!))
    assert.equal('course' in item ? item.course : item.title, courses.find(course => course.id === item.courseId)!.title)
  }
})
test('grades are derived from shared accepted tasks and archive attempts stay separate', () => {
  assert.equal(new Set(academicTasks.map(task => task.id)).size, academicTasks.length)
  for (const enrollment of enrollments) {
    const statement = gradeStatements.find(item => item.id === enrollment.id)!
    for (const row of statement.formula!) {
      const accepted = academicTasks.filter(task => task.enrollmentId === enrollment.id && task.activityId === row.id && task.status === 'accepted')
      assert.equal(row.completed, accepted.length)
      assert.equal(row.average, accepted.reduce((sum, task) => sum + task.grade!, 0) / accepted.length)
    }
    assert.equal(statement.grade, calculateGrade(statement.formula!).rounded)
  }
  assert.deepEqual(statementForCourse(featuredCourseId).formula!.map(row => row.weight), courseInfo.assessments.map(row => row.weight))
  const chatTask = assistantAssignments.find(item => item.id === courseAssignment.id)!
  assert.equal(chatTask.title, courseAssignment.title)
  assert.equal(chatTask.dueAt, courseAssignment.dueAt)
  assert.equal(statementForCourse(featuredCourseId).tasks!.find(item => item.id === chatTask.id)!.grade, null)
})
test('all shared material references resolve to real files owned by the same course', () => {
  assert.equal(new Set(academicMaterials.map(material => material.id)).size, academicMaterials.length)
  for (const material of academicMaterials) assert.ok(existsSync(new URL(`../public/${material.url}`, import.meta.url)))
  for (const task of academicTasks) for (const id of task.materialIds) {
    assert.equal(academicMaterials.find(material => material.id === id)!.courseId, task.courseId)
  }
  assert.deepEqual(learningMaterials.map(material => material.id), materialsForCourse(featuredCourseId).map(material => material.id))
})
test('assistant recognizes each canonical course and preserves its material filter on follow-up', () => {
  for (const course of courses) {
    const response = createMockResponse({ command: null, text: `Материалы по курсу ${course.title}` })
    const part = response.content.find(part => part.type === 'materials')
    assert.ok(part && part.type === 'materials')
    assert.equal(part.courseId, course.id)
    assert.equal(isGenerativePart(JSON.parse(JSON.stringify(part))), true)
    assert.ok(part.items.some(item => item.courseId === course.id))
  }
  const first = createMockResponse({ command: null, text: 'Материалы по машинному обучению' })
  const followup = createMockResponse({ command: null, text: 'Покажи только PDF' }, [{ id: 'assistant', role: 'assistant', createdAt: 1, ...first }])
  const part = followup.content.find(part => part.type === 'materials')
  assert.equal(part?.type === 'materials' && part.courseId, featuredCourseId)
})
test('restored cards refresh stale titles and URLs from IDs without trusting stored paths', () => {
  const current = academicMaterials[0]
  const part = resolveStudyPart({ type: 'materials', version: 1, query: '', subject: 'all', fileType: 'all', items: [{ ...current, course: 'Old course', url: 'https://untrusted.invalid/file' }] })
  assert.equal(part.type === 'materials' && part.items[0], current)
})

test('global search indexes every course and uses the exact shared material IDs', () => {
  assert.deepEqual(searchItems.filter(item => item.category === 'courses').map(item => item.courseId), courses.map(course => course.id))
  assert.deepEqual(searchItems.filter(item => item.category === 'materials').map(item => item.id), academicMaterials.map(material => `material-${material.id}`))
})

test('global search IDs are unique and task/statement destinations resolve exactly', () => {
  assert.equal(new Set(searchItems.map(item => item.id)).size, searchItems.length)
  for (const item of searchItems.filter(item => item.category === 'homework')) {
    const task = academicTasks.find(task => task.id === item.taskId)
    assert.ok(task)
    assert.equal(task.courseId, item.courseId)
    assert.equal(item.section, 'Курсы')
  }
  for (const item of searchItems.filter(item => item.category === 'grades')) {
    assert.ok(gradeStatements.some(statement => statement.id === item.statementId))
    assert.equal(item.section, 'Ведомости')
  }
})
