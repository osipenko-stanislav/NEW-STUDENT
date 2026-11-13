import { courses, featuredCourseId, getCourse, resolveCourseId } from './course-catalog.ts'
import { courseInfo, courseClasses, courseTeachers } from './course-content.ts'
import { seedAssignments, seedClasses, seedMaterials } from './study-seed.ts'
import { statisticsFormula, type FormulaRow, type GradeStatement } from './grade-fixtures.ts'
import { calculateGrade } from '../lib/grade-calculation.ts'
import type { DemoAssignment, DemoClass, DemoMaterial } from '../types/assistant.ts'

export type AcademicMaterial = DemoMaterial & { courseId: string; url: string; sizeLabel: string }
export type AcademicTask = {
  id: string; courseId: string; enrollmentId: string; title: string; topic: string; activityId: string; activity: string
  grade: number | null; status: 'new' | 'in-progress' | 'submitted' | 'accepted' | 'rejected'
  dueAt: string; description: string; materialIds: string[]; timeLimitMinutes?: number
}
export type Enrollment = { id: string; courseId: string; semester: number | null; archived: boolean; assessments: FormulaRow[] }
const subjectFor = (id: string) => id === 'python-basic' ? 'python' as const : getCourse(id).area
const titleFor = (id: string) => getCourse(id).title
const topics: Record<string, string[]> = {
  'machine-learning': ['Метрики и оценка качества', 'Контроль качества и выбор модели', 'Линейные модели'],
  algorithms: ['Структуры данных', 'Графы и обходы', 'Динамическое программирование'],
  architecture: ['Устройство процессора', 'Память и процессы', 'Файловые системы'],
  probability: ['Случайные события', 'Условная вероятность', 'Случайные величины'],
  'discrete-math': ['Множества и комбинаторика', 'Отношения и отображения', 'Графы и пути'],
  databases: ['Реляционная модель', 'Запросы SQL', 'Индексы и транзакции'],
  'computer-vision': ['Обработка изображений', 'Признаки изображений', 'Классификация изображений'],
  nlp: ['Подготовка текстов', 'Векторные представления', 'Классификация текстов'],
  calculus: ['Пределы и непрерывность', 'Производные', 'Интегралы'],
  'python-basic': ['Функции и работа со строками', 'Коллекции', 'Обработка файлов'],
  'data-engineering': ['Источники данных', 'Пайплайны обработки', 'Качество данных'],
  optimization: ['Градиентный спуск', 'Выпуклые функции', 'Ограничения'],
  cpp: ['Типы и память', 'Указатели', 'Контейнеры'],
  statistics: ['Описательная статистика', 'Оценивание параметров', 'Проверка гипотез'],
  'self-organization': ['Постановка целей', 'Планирование', 'Рефлексия'],
  'critical-thinking': ['Структура аргумента', 'Проверка источников', 'Когнитивные искажения'],
}
export const courseTopics = (courseId: string) => topics[courseId]

// Actual files are shared by course pages, assistant results and search.
export const academicMaterials: AcademicMaterial[] = [
  ...seedMaterials.map(material => {
    const courseId = resolveCourseId(material.course)!
    return { ...material, courseId, course: titleFor(courseId), subject: subjectFor(courseId),
      path: `Обучение / Курсы / ${titleFor(courseId)} / Материалы`,
      url: `assets/study/${material.id}.${material.fileType.toLowerCase()}`, sizeLabel: '1 КБ' }
  }),
  { id: 'metrics-notes', courseId: featuredCourseId, course: titleFor(featuredCourseId), subject: 'development', title: 'Конспект: метрики и функции потерь.pdf', fileType: 'PDF', path: `Обучение / Курсы / ${titleFor(featuredCourseId)} / Материалы`, description: 'Метрики регрессии и классификации.', url: 'assets/courses/metrics-notes.pdf', sizeLabel: '46 КБ' },
  { id: 'validation-guide', courseId: featuredCourseId, course: titleFor(featuredCourseId), subject: 'development', title: 'Памятка: проверка качества модели.md', fileType: 'MD', path: `Обучение / Курсы / ${titleFor(featuredCourseId)} / Материалы`, description: 'Разделение выборки и проверка качества модели.', url: 'assets/courses/validation-guide.md', sizeLabel: '895 Б' },
  ...courses.filter(course => ![featuredCourseId, 'discrete-math', 'python-basic', 'calculus', 'probability'].includes(course.id)).map(course => ({
    id: `${course.id}-notes`, courseId: course.id, course: course.title, subject: subjectFor(course.id), title: `Конспект: ${topics[course.id][0]}.md`, fileType: 'MD' as const,
    path: `Обучение / Курсы / ${course.title} / Материалы`, description: topics[course.id].join('. '), url: `assets/study/${course.id}-notes.md`, sizeLabel: '1 КБ',
  })),
]
export const materialsForCourse = (courseId: string) => academicMaterials.filter(material => material.courseId === courseId)
const seedGrades: Record<string, number> = { 'machine-learning': 5, algorithms: 9, probability: 9, statistics: 0, 'python-basic': 8, calculus: 7, 'discrete-math': 8 }
function assessmentsFor(courseId: string, grade: number): FormulaRow[] {
  if (courseId === 'statistics') return statisticsFormula.map(row => ({ ...row, average: grade }))
  if (courseId === featuredCourseId) return courseInfo.assessments.map((row, index) => ({ id: `activity-${index}`, title: row.title, average: grade, weight: row.weight, completed: row.count - (index === 0 ? 1 : 0), total: row.count }))
  return [
    { id: 'homework', title: 'Домашние задания', average: grade, weight: 30, completed: 3, total: 4 },
    { id: 'tests', title: 'Тесты', average: grade, weight: 20, completed: 3, total: 3 },
    { id: 'practice', title: 'Практические работы', average: grade, weight: 50, completed: 3, total: 3 },
  ]
}
export const enrollments: Enrollment[] = [
  ...courses.map(course => ({ id: `current-${course.id}`, courseId: course.id, semester: course.category === 'internal' ? null : 3, archived: false, assessments: assessmentsFor(course.id, seedGrades[course.id] ?? 7) })),
  ...['machine-learning', 'algorithms', 'probability', 'statistics'].map(courseId => ({ id: `archive-${courseId}`, courseId, semester: 2, archived: true, assessments: assessmentsFor(courseId, courseId === 'statistics' ? 6 : seedGrades[courseId] ?? 7) })),
]
export const academicTasks: AcademicTask[] = enrollments.flatMap(enrollment => enrollment.assessments.flatMap((row, rowIndex) => {
  const completed = row.completed ?? 3
  const tasks: AcademicTask[] = Array.from({ length: completed }, (_, index) => {
    const spread = Math.min(1, row.average, 10 - row.average)
    const offset = completed < 2 ? 0 : index === 0 ? -spread : index === completed - 1 ? spread : 0
    const topicIndex = index % 3
    return { id: `${enrollment.id}-${row.id}-${index + 1}`, courseId: enrollment.courseId, enrollmentId: enrollment.id,
      title: `${row.title} ${index + 1}. ${topics[enrollment.courseId][topicIndex]}`, topic: `Тема ${topicIndex + 1}: ${topics[enrollment.courseId][topicIndex]}`,
      timeLimitMinutes: index % 2 === 0 ? 180 : undefined, activityId: row.id, activity: row.title, grade: row.average + offset, status: 'accepted', dueAt: enrollment.archived ? '2026-05-10T23:59:00+03:00' : '2026-11-10T23:59:00+03:00',
      description: `Выполнить задания по теме «${topics[enrollment.courseId][topicIndex]}». Подготовить решение и объяснить выводы.`, materialIds: materialsForCourse(enrollment.courseId).map(item => item.id) }
  })
  if (rowIndex === 0 && !enrollment.archived) {
    const seed = seedAssignments.find(item => resolveCourseId(item.course) === enrollment.courseId)
    tasks.push({ id: seed?.id ?? (enrollment.courseId === featuredCourseId ? 'quality-homework' : `${enrollment.id}-next-homework`), courseId: enrollment.courseId, enrollmentId: enrollment.id,
      title: seed?.title ?? (enrollment.courseId === featuredCourseId ? 'Домашнее задание: метрики и оценка качества' : `Домашнее задание: ${topics[enrollment.courseId][0]}`),
      timeLimitMinutes: courses.findIndex(course => course.id === enrollment.courseId) % 2 === 0 ? 180 : undefined, topic: `Тема 1: ${topics[enrollment.courseId][0]}`, activityId: row.id, activity: row.title, grade: null, status: seed?.status ?? 'new',
      dueAt: seed?.dueAt ?? '2026-11-12T23:59:00+03:00', description: seed?.description ?? `Разобрать тему «${topics[enrollment.courseId][0]}». Решить практические задачи и объяснить выбор метода.`, materialIds: materialsForCourse(enrollment.courseId).map(item => item.id) })
  }
  return tasks
}))
export function tasksForCourse(courseId: string) { return academicTasks.filter(task => task.courseId === courseId && task.enrollmentId === `current-${courseId}`) }
export const gradeStatements: GradeStatement[] = enrollments.map(enrollment => {
  const course = getCourse(enrollment.courseId)
  const tasks = academicTasks.filter(task => task.enrollmentId === enrollment.id)
  const formula = enrollment.assessments.map(row => {
    const accepted = tasks.filter(task => task.activityId === row.id && task.status === 'accepted' && task.grade !== null)
    return { ...row, completed: accepted.length, average: accepted.length ? accepted.reduce((sum, task) => sum + task.grade!, 0) / accepted.length : 0 }
  })
  return { id: enrollment.id, courseId: course.id, title: course.title, semester: enrollment.semester, archived: enrollment.archived,
    format: course.category === 'required' ? 'Обязательный' : course.category === 'elective' ? 'Факультатив' : course.category === 'auditor' ? 'Вольнослушатель' : 'Внутренний',
    formula, grade: calculateGrade(formula).rounded,
    tasks: tasks.map(task => ({ id: task.id, title: task.title, topic: task.topic, grade: task.grade, activity: task.activity, status: task.status === 'accepted' ? 'Сдано' : task.status === 'rejected' ? 'Отклонено' : task.status === 'submitted' ? 'На проверке' : task.status === 'in-progress' ? 'В процессе' : 'Не начато', materialIds: task.materialIds })) }
})
export const statementForCourse = (courseId: string) => gradeStatements.find(statement => statement.courseId === courseId && !statement.archived)!
export const assistantAssignments: DemoAssignment[] = academicTasks.filter(task => task.enrollmentId.startsWith('current-') && task.status !== 'accepted' && task.status !== 'rejected').map(task => ({
  id: task.id, courseId: task.courseId, title: task.title, course: titleFor(task.courseId), subject: subjectFor(task.courseId), dueAt: task.dueAt,
  dueLabel: new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' }).format(new Date(task.dueAt)),
  status: task.status as DemoAssignment['status'], description: task.description,
})).sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id))
export const academicClasses: DemoClass[] = [...seedClasses.map(slot => {
  const courseId = resolveCourseId(slot.course)!
  return { ...slot, courseId, course: titleFor(courseId), subject: subjectFor(courseId) }
}), ...courseClasses.map(slot => ({
  id: slot.id, courseId: featuredCourseId, course: titleFor(featuredCourseId), subject: subjectFor(featuredCourseId), date: slot.date,
  dateLabel: new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' }).format(new Date(`${slot.date}T12:00:00+03:00`)),
  startsAt: slot.startsAt, endsAt: slot.endsAt, format: slot.type === 'lecture' ? 'Лекция' : slot.type === 'seminar' ? 'Семинар' : 'Коллоквиум',
  room: 'Онлайн', teacher: slot.teachers.map(id => courseTeachers.find(person => person.id === id)!.name).join(', '), topic: slot.recordings[0]?.title ?? slot.title,
}))].sort((a, b) => a.date.localeCompare(b.date) || a.startsAt.localeCompare(b.startsAt))
export const assistantClasses = academicClasses.filter(slot => slot.date >= '2026-11-09' && slot.date <= '2026-11-15')
