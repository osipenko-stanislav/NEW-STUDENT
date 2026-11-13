import { navigation, secondaryNavigation } from './navigation.ts'
import { courses } from './course-catalog.ts'
import { academicMaterials, academicTasks, gradeStatements } from './academic-data.ts'
import { lessonsForCourse } from './course-curricula.ts'
import handbook from './handbook-manifest.json' with { type: 'json' }
import type { SearchItem } from '../types/search.ts'

export const sectionSearchItems: SearchItem[] = [...navigation, ...secondaryNavigation].flatMap(item =>
  item.children
    ? item.children.map(title => ({ id: `section-${title}`, title, path: item.title, category: 'sections' as const, icon: item.icon, section: title }))
    : [{ id: `section-${item.title}`, title: item.title, path: 'Раздел', category: 'sections' as const, icon: item.icon, section: item.title }],
)
function handbookPath(id: string) {
  const ancestors: string[] = []
  let page = handbook.find(p => p.id === id)
  while (page?.parentId) {
    page = handbook.find(p => p.id === page!.parentId)
    if (page) ancestors.unshift(page.parentId ? page.title : 'Хэндбук')
  }
  return ancestors.join(' / ') || 'Хэндбук'
}
const subjectLabels = { math: 'Математика', python: 'Python', development: 'Разработка', general: 'Общие дисциплины' }
export const searchItems: SearchItem[] = [
  ...sectionSearchItems,
  ...courses.map(course => ({ id: `course-${course.id}`, courseId: course.id, title: course.title, path: 'Курсы', category: 'courses' as const, icon: 'book-open01-lined.svg', section: 'Курсы' })),
  ...courses.flatMap(course => lessonsForCourse(course.id).map(lesson => ({ id: `lesson-${course.id}-${lesson.id}`, lessonId: lesson.id, blockId: lesson.blockId, courseId: course.id, title: lesson.title, path: `${course.title} / Учебный материал`, category: 'lessons' as const, icon: 'book-open01-lined.svg', section: 'Курсы' }))),
  ...academicMaterials.map(material => ({ id: `material-${material.id}`, materialId: material.id, courseId: material.courseId, title: material.title, content: subjectLabels[material.subject], path: `${material.course} / Материалы`, category: 'materials' as const, icon: 'file06-lined.svg', section: 'Курсы', fileType: material.fileType })),
  ...academicTasks.map(task => ({ id: `homework-${task.id}`, taskId: task.id, courseId: task.courseId, title: task.title, path: `${courses.find(c => c.id === task.courseId)!.title} / ${task.enrollmentId.startsWith('archive-') ? 'Архив / ' : ''}Задания`, category: 'homework' as const, icon: 'file06-lined.svg', section: 'Курсы' })),
  ...gradeStatements.map(statement => ({ id: `grade-${statement.id}`, statementId: statement.id, courseId: statement.courseId, title: statement.title, path: `Ведомости / ${statement.archived ? 'Архив' : 'Актуальные'}${statement.semester ? ` / ${statement.semester} семестр` : ''}`, category: 'grades' as const, icon: 'file06-lined.svg', section: 'Ведомости' })),
  ...handbook.map(page => ({ id: `handbook-${page.id}`, handbookPageId: page.id, title: page.title, path: handbookPath(page.id), content: page.summary, category: 'handbook' as const, icon: 'file06-lined.svg', section: 'Хэндбук' })),
]
export const quickSearchSections = ['Навигатор', 'Расписание', 'Курсы', 'Домашки', 'Хэндбук', 'Ведомости', 'Настройки']
