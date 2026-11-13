import assert from 'node:assert/strict'
import { test } from 'node:test'
import { academicTasks, type AcademicTask } from '../src/data/academic-data.ts'
import { courses } from '../src/data/course-catalog.ts'
import { emptyHomework, homeworkStatus, parseHomeworkRecords, remainingHomeworkTime, validSolutionLink } from '../src/lib/homework-storage.ts'
const task = academicTasks.find(item => item.status === 'new')!
test('saved and submitted solutions update task status without altering accepted grades', () => {
  const record = { ...emptyHomework(), savedAt: 1000 }
  assert.equal(homeworkStatus(task, record), 'in-progress')
  assert.equal(homeworkStatus(task, { ...record, submittedAt: 2000 }), 'submitted')
  assert.equal(homeworkStatus({ ...task, status: 'accepted' }, record), 'accepted')
  assert.equal(homeworkStatus(task), task.status)
})
test('timer is derived from its persisted start and never becomes negative or restarts on reload', () => {
  const record = { ...emptyHomework(), startedAt: 1000 }
  assert.equal(remainingHomeworkTime(record, 180, 61000), 179 * 60000)
  assert.equal(remainingHomeworkTime(record, 180, 20000000), 0)
  assert.equal(remainingHomeworkTime(emptyHomework(), 180, 20000000), 180 * 60000)
})
test('solution links accept only full http and https URLs', () => {
  for (const link of ['', 'https://example.com/work', 'http://example.com']) assert.equal(validSolutionLink(link), true)
  for (const link of ['example.com', 'javascript:alert(1)', 'data:text/html,hello', 'file:///tmp/work']) assert.equal(validSolutionLink(link), false)
})
test('stored homework rejects corrupt records while retaining valid comments and file metadata', () => {
  const record = { ...emptyHomework(), link: 'https://example.com/work', startedAt: 1000, savedAt: 2000,
    files: [{ id: 'file-1', name: 'solution.py', type: 'text/plain', size: 42 }],
    comments: [{ id: 'comment-1', at: 3000, text: 'Проверил результат.' }] }
  assert.deepEqual(parseHomeworkRecords(JSON.stringify({ good: record, bad: { ...record, files: [{}] }, unsafe: { ...record, link: 'javascript:alert(1)' } })), { good: record })
  assert.deepEqual(parseHomeworkRecords('{bad'), {})
  assert.deepEqual(parseHomeworkRecords('[]'), {})
})
test('both homework modes belong to the shared course catalog and every course has examples', () => {
  for (const course of courses) {
    const tasks = academicTasks.filter((task: AcademicTask) => task.courseId === course.id && task.enrollmentId === `current-${course.id}` && /домашн/i.test(task.activity))
    assert.ok(tasks.some(task => task.timeLimitMinutes === 180), course.id)
    assert.ok(tasks.some(task => task.timeLimitMinutes === undefined), course.id)
  }
})
