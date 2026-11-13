import { taskDeadline } from './late-days.ts'
import { homeworkStatus, type HomeworkRecord } from './homework-storage.ts'
import { academicTasks } from '../data/academic-data.ts'
import type { LateDaysState } from '../data/late-days.ts'
import { createLateDaysResponse } from './late-days-assistant.ts'
import { seedLateDays } from '../data/late-days.ts'
import { demoAssignments, demoClasses, demoDays, demoMaterials, demoToday, demoTomorrow } from '../data/study-demo.ts'
import { courses } from '../data/course-catalog.ts'
import type { AssignmentsPart, CourseFilter, DemoAssignment, MockContext, SchedulePart } from '../types/assistant.ts'
import type { ChatMessage, ConversationDraft, MessageAttachment, MessagePart } from '../types/conversation.ts'

export type MockResponse = { content: MessagePart[]; attachments?: MessageAttachment[]; mockContext?: MockContext; suggestions: string[] }
type Intent = 'today' | 'tomorrow' | 'week' | 'assignments' | 'materials' | 'deadlines' | 'nearest' | 'active' | 'submitted' | 'math' | 'python' | 'mathMaterials' | 'pythonMaterials' | 'pdf'
export function normalizeMockQuery(value: string): string {
  return value.toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/[.,!?…/]+/g, '').replace(/\s+/g, ' ').trim()
}
// An explicit phrase table, not an attempt to interpret arbitrary language.
const phrases: Record<Intent, string[]> = {
  today: ['расписание сегодня', 'что у меня сегодня', 'покажи расписание на сегодня', 'сегодня'],
  tomorrow: ['а что у меня завтра', 'что у меня завтра', 'а завтра', 'завтра', 'на завтра', 'покажи расписание на завтра'],
  week: ['моя неделя', 'покажи мою неделю', 'расписание на неделю'],
  assignments: ['домашки', 'мои домашки', 'покажи домашки'],
  materials: ['материалы', 'найди материалы', 'покажи материалы'],
  deadlines: ['покажи только домашки', 'только домашки', 'покажи дедлайны'],
  nearest: ['какая ближайшая сдача', 'ближайшая сдача', 'ближайший дедлайн'],
  active: ['покажи несданные', 'только несданные', 'несданные'],
  submitted: ['покажи сданные', 'только сданные', 'сданные'],
  math: ['по математике', 'только математика'],
  mathMaterials: ['найди материалы по математике', 'материалы по математике'],
  python: ['по python', 'только python'],
  pythonMaterials: ['найди материалы по python', 'материалы по python'],
  pdf: ['покажи только pdf', 'только pdf'],
}
const intents = new Map(Object.entries(phrases).flatMap(([intent, values]) => values.map(value => [value, intent as Intent] as const)))
const commandIntents: Record<string, Intent> = { 'расписание сегодня': 'today', 'моя неделя': 'week', 'домашки': 'assignments', 'материалы': 'materials' }
const contextFor = (scenario: MockContext['scenario'], day = demoToday, subject: CourseFilter = 'all'): MockContext => ({ scenario, day, subject })

function scheduleResponse(currentAssignments: DemoAssignment[], mode: 'day' | 'week', day: string, view: SchedulePart['view'] = 'all', subject: CourseFilter = 'all'): MockResponse {
  const date = demoDays.find(item => item.date === day)!
  const classes = demoClasses.filter(item => subject === 'all' || item.subject === subject)
  const assignments = currentAssignments.filter(item => subject === 'all' || item.subject === subject)
  const selectedClasses = classes.filter(item => mode === 'week' || item.date === day)
  const selectedAssignments = assignments.filter(item => mode === 'week' || item.dueAt.startsWith(day))
  const text = mode === 'week'
    ? `На неделе занятий: ${selectedClasses.length}, дедлайнов: ${selectedAssignments.length}. Занятия и задания собраны по дням.`
    : `${date.label}. Занятий: ${selectedClasses.length}. ${selectedClasses.map(item => `${item.course} — ${item.startsAt}`).join('; ')}. Дедлайнов: ${selectedAssignments.length}.`
  return { content: [{ type: 'text', text }, { type: 'schedule', version: 1, mode, days: demoDays, selectedDay: day, view, classes, assignments }],
    mockContext: contextFor(mode === 'week' ? 'week' : 'schedule', day, subject),
    suggestions: mode === 'week' ? ['А что у меня завтра?', 'Покажи только домашки', 'Какая ближайшая сдача?']
      : day === demoToday ? ['А что у меня завтра?', 'Моя неделя', 'Какая ближайшая сдача?'] : ['Расписание сегодня', 'Моя неделя', 'Покажи только домашки'] }
}
function assignmentsResponse(currentAssignments: DemoAssignment[], filter: AssignmentsPart['filter'] = 'all', subject: CourseFilter = 'all', nearest = false, day?: string, courseId?: string): MockResponse {
  let items = currentAssignments.filter(item => (!courseId || item.courseId === courseId) && (subject === 'all' || item.subject === subject) && (!day || item.dueAt.startsWith(day)))
  if (nearest) items = items.filter(item => item.status !== 'submitted').slice(0, 1)
  const closest = items[0]
  const visible = items.filter(item => filter === 'all' || (filter === 'active' ? item.status !== 'submitted' : item.status === filter))
  const text = nearest
    ? closest ? `Ближайшая несданная работа — «${closest.title}». Срок — ${closest.dueLabel} МСК. В карточке можно раскрыть условие задания.` : 'Несданных работ с такими условиями нет.'
    : !visible.length ? 'Заданий с выбранными условиями нет.' : `Заданий: ${visible.length}. Открой задание, чтобы посмотреть условие и отправить решение.`
  return { content: [{ type: 'text', text }, { type: 'assignments', version: 1, items, filter, subject }],
    mockContext: { ...contextFor('assignments', day ?? demoToday, subject), ...(courseId ? { courseId } : {}) },
    suggestions: ['Покажи несданные', 'Какая ближайшая сдача?', 'Покажи сданные'] }
}
function materials(subject: CourseFilter = 'all', pdf = false, courseId?: string): MockResponse {
  const count = demoMaterials.filter(item => (!courseId || item.courseId === courseId) && (subject === 'all' || item.subject === subject) && (!pdf || item.fileType === 'PDF')).length
  return { content: [{ type: 'text', text: count ? `Найдено материалов: ${count}. Выбери файл, чтобы открыть его.` : 'Материалы с такими условиями не найдены. Попробуй другой курс или тип файла.' },
    { type: 'materials', version: 1, items: demoMaterials, query: '', subject, ...(courseId ? { courseId } : {}), fileType: pdf ? 'PDF' : 'all' }],
    mockContext: { ...contextFor('materials', demoToday, subject), ...(courseId ? { courseId } : {}) },
    suggestions: ['Найди материалы по математике', 'Найди материалы по Python', 'Покажи только PDF'] }
}
const queryAliases: Record<string, string[]> = {
  'machine-learning': ['машинному обучению', 'машинное обучение', 'machine learning', 'ml'],
  'python-basic': ['python', 'питону'], statistics: ['статистике'], algorithms: ['алгоритмам'],
  'discrete-math': ['дискретной математике'], probability: ['теории вероятностей'], calculus: ['математическому анализу'],
}
function queryCourse(text: string) {
  return courses.find(course => [course.title, ...(queryAliases[course.id] ?? [])].some(alias => {
    const name = normalizeMockQuery(alias)
    return text === name || text.endsWith(` ${name}`)
  }))
}

function unsupported(context?: MockContext, hasFiles = false): MockResponse {
  return { content: [{ type: 'text', text: hasFiles
    ? 'Файлы прикреплены к сообщению. Их содержимое пока не используется в ответах. Могу помочь с расписанием, домашками и учебными материалами.'
    : 'Не удалось найти ответ. Попробуй уточнить запрос: я могу помочь с расписанием, домашками и учебными материалами.' }],
    ...(context ? { mockContext: context } : {}), suggestions: ['Расписание сегодня', 'Домашки', 'Материалы'] }
}
export function createMockResponse(draft: ConversationDraft, messages: ChatMessage[] = [], lateContext?: { state: LateDaysState; records: Record<string, HomeworkRecord> }): MockResponse {
  const lateDays = createLateDaysResponse(draft, lateContext?.state ?? seedLateDays(), lateContext?.records ?? {})
  if (lateDays) return lateDays
  const currentAssignments = lateContext ? demoAssignments.map(item => {
    const task = academicTasks.find(task => task.id === item.id)!
    const dueAt = taskDeadline(lateContext.state, task)
    const status = homeworkStatus(task, lateContext.records[task.id])
    return { ...item, dueAt, status: status === 'accepted' || status === 'rejected' ? 'submitted' as const : status, dueLabel: new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' }).format(new Date(dueAt)) }
  }).sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id)) : demoAssignments
  const schedule = (mode: 'day' | 'week', day: string, view: SchedulePart['view'] = 'all', subject: CourseFilter = 'all') => scheduleResponse(currentAssignments, mode, day, view, subject)
  const assignments = (filter: AssignmentsPart['filter'] = 'all', subject: CourseFilter = 'all', nearest = false, day?: string, courseId?: string) => assignmentsResponse(currentAssignments, filter, subject, nearest, day, courseId)
  const previous = [...messages].reverse().find(message => message.role === 'assistant' && message.mockContext)?.mockContext
  const command = draft.command ? commandIntents[normalizeMockQuery(draft.command)] : undefined
  const text = normalizeMockQuery(draft.text)
  const intent = text ? intents.get(text) : command
  const context = command === 'week' ? contextFor('week') : command === 'today' ? contextFor('schedule')
    : command === 'assignments' ? contextFor('assignments') : command === 'materials' ? contextFor('materials') : previous
  const course = queryCourse(text)
  if (course && (!intent || intent === 'pythonMaterials' || intent === 'python')) {
    if (text.includes('домаш') || text.includes('задани') || context?.scenario === 'assignments' && !text.includes('материал')) return assignments('all', 'all', false, undefined, course.id)
    return materials('all', false, course.id)
  }
  switch (intent) {
    case 'today': return schedule('day', demoToday)
    case 'week': return schedule('week', demoToday)
    case 'assignments': return assignments()
    case 'materials': return materials()
    case 'tomorrow':
      if (context?.scenario === 'assignments') return assignments('all', context.subject, false, demoTomorrow, context.courseId)
      return schedule('day', demoTomorrow)
    case 'deadlines': return context?.scenario === 'week' ? schedule('week', context.day, 'deadlines', context.subject) : assignments('active')
    case 'nearest': return assignments('active', context?.scenario === 'assignments' ? context.subject : 'all', true, undefined, context?.courseId)
    case 'active': return assignments('active', context?.scenario === 'assignments' ? context.subject : 'all', false, undefined, context?.courseId)
    case 'submitted': return assignments('submitted', context?.scenario === 'assignments' ? context.subject : 'all', false, undefined, context?.courseId)
    case 'mathMaterials': return materials('math')
    case 'pythonMaterials': return materials('python')
    case 'math': return context?.scenario === 'assignments' ? assignments('all', 'math') : materials('math')
    case 'python': return context?.scenario === 'assignments' ? assignments('all', 'python') : materials('python')
    case 'pdf': return materials(context?.scenario === 'materials' ? context.subject : 'all', true, context?.courseId)
    default: return unsupported(previous, !!draft.attachments?.length)
  }
}
