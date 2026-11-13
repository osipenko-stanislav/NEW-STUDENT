import assert from 'node:assert/strict'
import { test } from 'node:test'
import { courses, courseLessons, curriculumBlocks, learningMaterials, courseInfo, courseClasses, courseTeachers } from '../src/data/courses.ts'

test('retains the handbook thematic sequence: four blocks and fifteen topics', () => {
  assert.deepEqual(curriculumBlocks.map(block => block.entities.filter(entity => entity.kind === 'lesson').length), [2, 3, 5, 5])
  assert.equal(courseLessons.length, 15)
  assert.equal(courseLessons[0].title, 'Метрики и функционалы потерь в задачах регрессии и классификации')
  assert.equal(courseLessons.at(-1)?.title, 'Частые вопросы на ML-собеседованиях')
  assert.deepEqual(curriculumBlocks.flatMap(block => block.entities.filter(entity => entity.kind === 'lesson').map(entity => entity.lessonId)), courseLessons.map(lesson => lesson.id))
  assert.equal(courseInfo.assessments.reduce((total, item) => total + item.weight, 0), 100)
})
test('every lesson, material and teacher reference resolves', () => {
  for (const block of curriculumBlocks) for (const entity of block.entities) {
    if (entity.lessonId) assert.ok(courseLessons.some(lesson => lesson.id === entity.lessonId))
    if (entity.materialId) assert.ok(learningMaterials.some(material => material.id === entity.materialId))
  }
  for (const item of courseClasses) for (const teacher of item.teachers) assert.ok(courseTeachers.some(person => person.id === teacher))
  assert.equal(new Set(courseLessons.map(lesson => lesson.id)).size, courseLessons.length)
  assert.equal(new Set(courses.map(course => course.id)).size, courses.length)
})
test('course names stay emoji-free, with optional or mixed levels stored independently', () => {
  for (const course of courses) {
    assert.equal(course.source, 'handbook')
    assert.doesNotMatch(course.title, /\p{Extended_Pictographic}/u)
    assert.equal(new Set(course.levels).size, course.levels.length)
  }
  assert.ok(courses.some(course => course.levels.length === 0))
  assert.ok(courses.some(course => course.levels.length > 1))
})

test('every course exposes its own curriculum with valid lesson, task and material links', async () => {
  const { lessonsForCourse, blocksForCourse } = await import('../src/data/course-curricula.ts')
  const { academicTasks, academicMaterials } = await import('../src/data/academic-data.ts')
  const { lectureText } = await import('../src/data/lecture-content.ts')
  const allIds: string[] = []
  for (const course of courses) {
    const lessons = lessonsForCourse(course.id)
    const blocks = blocksForCourse(course.id)
    assert.ok(lessons.length >= 3)
    assert.ok(blocks.length >= 3)
    allIds.push(...lessons.map(lesson => lesson.id))
    for (const block of blocks) for (const entity of block.entities) {
      if (entity.lessonId) assert.ok(lessons.some(lesson => lesson.id === entity.lessonId && lesson.blockId === block.id))
      if (entity.materialId) assert.equal(academicMaterials.find(item => item.id === entity.materialId)?.courseId, course.id)
      if (entity.kind === 'assignment') assert.equal(academicTasks.find(task => task.id === entity.id)?.courseId, course.id)
    }
    if (course.id !== 'machine-learning') lessons.forEach((_, index) => {
      const text = lectureText(course.id, index)
      assert.ok(text.explanation.length > 150)
      assert.ok(text.example.length > 100)
      assert.ok(text.exercise.length > 70)
    })
  }
  assert.equal(new Set(allIds).size, allIds.length)
})
