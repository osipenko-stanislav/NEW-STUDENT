import { featuredCourseId } from './course-catalog.ts'
import { courseLessons, curriculumBlocks, type CourseBlock, type CourseLesson } from './course-content.ts'
import { courseTopics, materialsForCourse, tasksForCourse } from './academic-data.ts'
import { lectureText } from './lecture-content.ts'
export function lessonsForCourse(courseId: string): CourseLesson[] {
  if (courseId === featuredCourseId) return courseLessons
  return courseTopics(courseId).map((title, index) => ({
    id: `${courseId}-lesson-${index + 1}`, blockId: `${courseId}-block-${index + 1}`, title,
    format: 'Учебный материал', readingMinutes: 5,
    summary: lectureText(courseId, index).explanation, focus: [title, 'Разбор примера', 'Самостоятельная практика'],
  }))
}
export function blocksForCourse(courseId: string): CourseBlock[] {
  if (courseId === featuredCourseId) return curriculumBlocks
  return lessonsForCourse(courseId).map((lesson, index) => ({ id: lesson.blockId, title: lesson.title, entities: [
    { id: lesson.id, kind: 'lesson', title: lesson.title, lessonId: lesson.id, status: index === 0 ? 'active' : 'idle' },
    ...tasksForCourse(courseId).filter(task => task.topic.startsWith(`Тема ${index + 1}:`)).map(task => ({
      id: task.id, kind: 'assignment' as const, title: task.title, status: task.status === 'accepted' ? 'completed' as const : task.status === 'in-progress' ? 'active' as const : 'idle' as const,
    })),
    ...materialsForCourse(courseId).map(material => ({ id: `${lesson.id}-${material.id}`, kind: 'material' as const, title: material.title, materialId: material.id, status: 'idle' as const })),
  ] }))
}
