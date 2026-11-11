import { demoAssignments, demoClasses, demoDays, demoMaterials, demoToday, demoTomorrow } from '../data/study-demo.ts'
import type { AssignmentsPart, CourseFilter, MockContext, SchedulePart } from '../types/assistant.ts'
import type { ChatMessage, ConversationDraft, MessagePart } from '../types/conversation.ts'

export type MockResponse = { content: MessagePart[]; mockContext?: MockContext; suggestions: string[] }
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

function schedule(mode: 'day' | 'week', day: string, view: SchedulePart['view'] = 'all', subject: CourseFilter = 'all'): MockResponse {
  const date = demoDays.find(item => item.date === day)!
  const classes = demoClasses.filter(item => subject === 'all' || item.subject === subject)
  const assignments = demoAssignments.filter(item => subject === 'all' || item.subject === subject)
  const text = mode === 'week'
    ? view === 'deadlines'
      ? 'Оставил только дедлайны этой недели. Можно переключать дни и открывать условия заданий.'
      : 'На неделе 10 занятий и 4 дедлайна. Ближайшая несданная работа — по линейной алгебре, 11 ноября до 23:59. Занятия и сдачи собраны по дням.'
    : day === demoToday
      ? 'Сегодня две пары: математический анализ и теория вероятностей. Первая начинается в 09:00, между занятиями — 10 минут. Вечером дедлайн по линейной алгебре.'
      : `Завтра, ${date.label}, две пары: практика по Python в 12:00 и семинар по линейной алгебре в 14:00. До 18:00 нужно сдать работу по функциям и строкам.`
  return { content: [{ type: 'text', text }, { type: 'schedule', version: 1, mode, days: demoDays, selectedDay: day, view, classes, assignments }],
    mockContext: contextFor(mode === 'week' ? 'week' : 'schedule', day, subject),
    suggestions: mode === 'week' ? ['А что у меня завтра?', 'Покажи только домашки', 'Какая ближайшая сдача?']
      : day === demoToday ? ['А что у меня завтра?', 'Моя неделя', 'Какая ближайшая сдача?'] : ['Расписание сегодня', 'Моя неделя', 'Покажи только домашки'] }
}
function assignments(filter: AssignmentsPart['filter'] = 'all', subject: CourseFilter = 'all', nearest = false, day?: string): MockResponse {
  let items = demoAssignments.filter(item => (subject === 'all' || item.subject === subject) && (!day || item.dueAt.startsWith(day)))
  if (nearest) items = items.filter(item => item.status !== 'submitted').slice(0, 1)
  const closest = items[0]
  const text = nearest
    ? closest ? `Ближайшая несданная работа — «${closest.title}». Срок — ${closest.dueLabel} МСК. В карточке можно раскрыть условие задания.`
      : 'Несданных работ с такими условиями нет.'
    : day ? items.length ? 'Завтра до 18:00 нужно сдать работу по Python. Ниже — условие и текущий статус.' : 'На завтра заданий по выбранным курсам нет.'
      : subject !== 'all' ? `Выбрал задания по ${subject === 'math' ? 'математическим курсам' : 'Python'}. Фильтр статуса поможет отделить сданные работы от оставшихся.`
        : filter === 'submitted' ? 'Работа по условной вероятности уже отправлена на проверку. Она остается в списке со статусом «Сдано».'
          : filter === 'active' ? 'Еще не сданы три работы. Ближайший срок — сегодня, 23:59, по линейной алгебре.'
            : 'На неделе четыре работы: две новые, одна в процессе и одна сдана. Ближайший срок — сегодня, 23:59, по линейной алгебре.'
  return { content: [{ type: 'text', text }, { type: 'assignments', version: 1, items, filter, subject }],
    mockContext: contextFor('assignments', day ?? demoToday, subject),
    suggestions: ['Покажи несданные', 'Какая ближайшая сдача?', 'Покажи сданные'] }
}
function materials(subject: CourseFilter = 'all', pdf = false): MockResponse {
  return { content: [{ type: 'text', text: pdf && subject === 'python' ? 'По Python в демонстрационной подборке есть только ноутбук. PDF не найдены; можно изменить фильтр типа файла.' : subject === 'math'
    ? 'По математике есть три материала: матрицы, пределы и условная вероятность. Можно уточнить название или отфильтровать тип файла.'
    : subject === 'python' ? 'Для Python подготовлен ноутбук с примерами функций. Он относится к той же теме, что и ближайшая домашка.'
      : pdf ? 'Оставил три PDF по математическим курсам. Ноутбук по Python скрыт фильтром.'
        : 'Нашел четыре учебных материала по текущим темам. Ищите по названию, курсу или расположению; фильтры работают прямо в ответе.' },
    { type: 'materials', version: 1, items: demoMaterials, query: '', subject, fileType: pdf ? 'PDF' : 'all' }],
    mockContext: contextFor('materials', demoToday, subject),
    suggestions: ['Найди материалы по математике', 'Найди материалы по Python', 'Покажи только PDF'] }
}
function unsupported(context?: MockContext, hasFiles = false): MockResponse {
  return { content: [{ type: 'text', text: hasFiles
    ? 'Файлы прикреплены к сообщению, но анализировать их содержимое этот прототип пока не умеет. Доступны демонстрационные расписание, домашки и учебные материалы.'
    : 'Для этого запроса сценарий пока не подготовлен. В прототипе можно посмотреть расписание, неделю, домашки и учебные материалы.' }],
    ...(context ? { mockContext: context } : {}), suggestions: ['Расписание сегодня', 'Домашки', 'Материалы'] }
}
export function createMockResponse(draft: ConversationDraft, messages: ChatMessage[] = []): MockResponse {
  const previous = [...messages].reverse().find(message => message.role === 'assistant' && message.mockContext)?.mockContext
  const command = draft.command ? commandIntents[normalizeMockQuery(draft.command)] : undefined
  const text = normalizeMockQuery(draft.text)
  const intent = text ? intents.get(text) : command
  const context = command === 'week' ? contextFor('week') : command === 'today' ? contextFor('schedule')
    : command === 'assignments' ? contextFor('assignments') : command === 'materials' ? contextFor('materials') : previous
  switch (intent) {
    case 'today': return schedule('day', demoToday)
    case 'week': return schedule('week', demoToday)
    case 'assignments': return assignments()
    case 'materials': return materials()
    case 'tomorrow':
      if (context?.scenario === 'assignments') return assignments('all', context.subject, false, demoTomorrow)
      return schedule('day', demoTomorrow)
    case 'deadlines': return context?.scenario === 'week' ? schedule('week', context.day, 'deadlines', context.subject) : assignments('active')
    case 'nearest': return assignments('active', context?.scenario === 'assignments' ? context.subject : 'all', true)
    case 'active': return assignments('active', context?.scenario === 'assignments' ? context.subject : 'all')
    case 'submitted': return assignments('submitted', context?.scenario === 'assignments' ? context.subject : 'all')
    case 'mathMaterials': return materials('math')
    case 'pythonMaterials': return materials('python')
    case 'math': return context?.scenario === 'assignments' ? assignments('all', 'math') : materials('math')
    case 'python': return context?.scenario === 'assignments' ? assignments('all', 'python') : materials('python')
    case 'pdf': return materials(context?.scenario === 'materials' ? context.subject : 'all', true)
    default: return unsupported(previous, !!draft.attachments?.length)
  }
}
