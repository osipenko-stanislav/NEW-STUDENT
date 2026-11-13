type CourseArea = 'development' | 'math' | 'general'
type CourseLevel = 'basic' | 'medium' | 'advanced'
export type CourseFilter = 'all' | 'required' | 'elective' | 'auditor' | 'internal'
export type Course = { id: string; title: string; area: CourseArea; category: Exclude<CourseFilter, 'all'>; levels: CourseLevel[]; source: 'handbook'; syllabusUrl?: string }
export const handbookUrl = 'https://note.cu.ru/at/2284e072-1f5d-47d2-b4c9-cceb9716ef6f'
export const courseFilters: { id: CourseFilter; label: string }[] = [
  { id: 'all', label: 'Все' }, { id: 'required', label: 'Обязательные' }, { id: 'elective', label: 'Факультативные' },
  { id: 'auditor', label: 'Вольнослушатель' }, { id: 'internal', label: 'Внутренние' },
]
export const areaLabels: Record<CourseArea, string> = { development: 'Разработка', math: 'Математика', general: 'Общие' }
export const levelLabels: Record<CourseLevel, string> = { basic: 'Базовый', medium: 'Средний', advanced: 'Продвинутый' }
// Course titles and levels are sourced from the School of Technology bachelor handbook.
// Enrollment categories and student progress are demo data. Multiple stars mean available formats.
export const featuredCourseId = 'machine-learning'
export const featuredCourseTitle = 'Машинное обучение (Machine Learning)'
export const syllabusUrl = 'https://note.cu.ru/at/3340dcf5-0e15-43db-929f-7cdd950753bb'
export const courses: Course[] = [
  { id: featuredCourseId, title: featuredCourseTitle, area: 'development', category: 'required', levels: [], source: 'handbook', syllabusUrl },
  { id: 'algorithms', title: 'Алгоритмы и структуры данных', area: 'development', category: 'required', levels: ['medium', 'advanced'], source: 'handbook' },
  { id: 'architecture', title: 'Архитектура компьютера и операционные системы I', area: 'development', category: 'required', levels: [], source: 'handbook' },
  { id: 'probability', title: 'Теория вероятностей', area: 'math', category: 'required', levels: ['basic', 'medium'], source: 'handbook' },
  { id: 'discrete-math', title: 'Дискретная математика', area: 'math', category: 'required', levels: ['medium', 'advanced'], source: 'handbook' },
  { id: 'databases', title: 'Базы данных', area: 'development', category: 'required', levels: [], source: 'handbook' },
  { id: 'computer-vision', title: 'Компьютерное зрение', area: 'development', category: 'elective', levels: [], source: 'handbook' },
  { id: 'nlp', title: 'Обработка естественного языка (NLP)', area: 'development', category: 'auditor', levels: [], source: 'handbook' },
  { id: 'calculus', title: 'Математический анализ', area: 'math', category: 'required', levels: ['medium', 'advanced'], source: 'handbook' },
  { id: 'python-basic', title: 'Язык программирования Python. Базовый', area: 'development', category: 'elective', levels: ['basic'], source: 'handbook' },
  { id: 'data-engineering', title: 'Инженерия данных', area: 'development', category: 'required', levels: [], source: 'handbook' },
  { id: 'optimization', title: 'Методы непрерывной оптимизации', area: 'math', category: 'elective', levels: [], source: 'handbook' },
  { id: 'cpp', title: 'Язык программирования С++ 1', area: 'development', category: 'required', levels: [], source: 'handbook' },
  { id: 'statistics', title: 'Введение в статистику', area: 'math', category: 'required', levels: ['medium', 'advanced'], source: 'handbook' },
  { id: 'self-organization', title: 'Целеполагание, планирование и самоорганизация', area: 'general', category: 'internal', levels: [], source: 'handbook' },
  { id: 'critical-thinking', title: 'Системное и критическое мышление', area: 'general', category: 'elective', levels: [], source: 'handbook' },
]


export function getCourse(id: string): Course {
  const course = courses.find(item => item.id === id)
  if (!course) throw new Error(`Unknown course: ${id}`)
  return course
}
const courseAliases: Record<string, string> = {
  'Machine Learning': 'machine-learning', 'Программирование на Python': 'python-basic',
}
export function resolveCourseId(title: string): string | undefined {
  const normalized = title.replace(/\s+/g, ' ').trim()
  return courseAliases[normalized] ?? courses.find(course => course.title === normalized)?.id
}
