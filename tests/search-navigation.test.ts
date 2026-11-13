import assert from 'node:assert/strict'
import { test } from 'node:test'
import { navigationForSearch } from '../src/lib/search-navigation.ts'
import type { SearchItem } from '../src/types/search.ts'

const base: SearchItem = { id: 'result', title: 'Объект', path: 'Курс', icon: 'file.svg', category: 'lessons', section: 'Курсы', courseId: 'python' }
test('opens exact lesson and clears previously selected entities', () => {
  const target = navigationForSearch({ ...base, lessonId: 'lesson-4', blockId: 'week-2' })
  assert.equal(target.lessonId, 'lesson-4')
  assert.equal(target.originBlockId, 'week-2')
  assert.equal(target.courseId, 'python')
  assert.equal(target.taskId, null)
  assert.equal(target.materialId, null)
})
test('opens task, material, archived statement and handbook as exact destinations', () => {
  const task = navigationForSearch({ ...base, category: 'homework', taskId: 'archive-task-2' })
  assert.equal(task.taskId, 'archive-task-2')
  assert.equal(task.courseTab, 'homework')
  const material = navigationForSearch({ ...base, category: 'materials', materialId: 'file-2' })
  assert.equal(material.materialId, 'file-2')
  assert.equal(material.courseTab, 'materials')
  const statement = navigationForSearch({ ...base, section: 'Ведомости', category: 'grades', statementId: 'archive-statement' })
  assert.equal(statement.statementId, 'archive-statement')
  assert.equal(statement.courseId, null)
  const wiki = navigationForSearch({ ...base, section: 'Хэндбук', category: 'handbook', handbookPageId: 'article-2' })
  assert.equal(wiki.handbookPageId, 'article-2')
  assert.equal(wiki.handbookAnchor, null)
})
