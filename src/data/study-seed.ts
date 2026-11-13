import type { DemoAssignment, DemoClass, DemoDay, DemoMaterial } from '../types/assistant.ts'

// A fixed demonstration week: “today” and “tomorrow” stay consistent in restored conversations.
export const demoToday = '2026-11-11'
export const demoTomorrow = '2026-11-12'
export const demoDays: DemoDay[] = [
  { date: '2026-11-09', short: 'Пн', label: '9 ноября' },
  { date: '2026-11-10', short: 'Вт', label: '10 ноября' },
  { date: demoToday, short: 'Ср', label: '11 ноября' },
  { date: demoTomorrow, short: 'Чт', label: '12 ноября' },
  { date: '2026-11-13', short: 'Пт', label: '13 ноября' },
  { date: '2026-11-14', short: 'Сб', label: '14 ноября' },
  { date: '2026-11-15', short: 'Вс', label: '15 ноября' },
]
export const seedClasses: DemoClass[] = [
  { id: 'python-lecture', date: '2026-11-09', dateLabel: '9 ноября, пн', startsAt: '10:30', endsAt: '11:50', course: 'Программирование на Python', subject: 'python', format: 'Лекция', room: 'Ауд. 302', teacher: 'Мария Соколова', topic: 'Функции, аргументы и возвращаемые значения' },
  { id: 'algebra-seminar', date: '2026-11-09', dateLabel: '9 ноября, пн', startsAt: '12:00', endsAt: '13:20', course: 'Дискретная математика', subject: 'math', format: 'Семинар', room: 'Ауд. 204', teacher: 'Алексей Волков', topic: 'Множества и операции над ними' },
  { id: 'linear-algebra-lecture', date: '2026-11-10', dateLabel: '10 ноября, вт', startsAt: '14:00', endsAt: '15:20', course: 'Дискретная математика', subject: 'math', format: 'Лекция', room: 'Ауд. 201', teacher: 'Алексей Волков', topic: 'Комбинаторика и правила подсчета' },
  { id: 'python-practice', date: '2026-11-10', dateLabel: '10 ноября, вт', startsAt: '15:30', endsAt: '16:50', course: 'Программирование на Python', subject: 'python', format: 'Практика', room: 'Ауд. 305', teacher: 'Мария Соколова', topic: 'Функции и обработка строк' },
  { id: 'calculus-seminar', date: demoToday, dateLabel: '11 ноября, ср', startsAt: '09:00', endsAt: '10:20', course: 'Математический анализ', subject: 'math', format: 'Семинар', room: 'Ауд. 204', teacher: 'Ирина Морозова', topic: 'Пределы последовательностей и непрерывность' },
  { id: 'probability-lecture', date: demoToday, dateLabel: '11 ноября, ср', startsAt: '10:30', endsAt: '11:50', course: 'Теория вероятностей', subject: 'math', format: 'Лекция', room: 'Ауд. 201', teacher: 'Дмитрий Орлов', topic: 'Условная вероятность и формула Байеса' },
  { id: 'python-thursday', date: demoTomorrow, dateLabel: '12 ноября, чт', startsAt: '12:00', endsAt: '13:20', course: 'Программирование на Python', subject: 'python', format: 'Практика', room: 'Ауд. 305', teacher: 'Мария Соколова', topic: 'Разбор задач на функции' },
  { id: 'algebra-thursday', date: demoTomorrow, dateLabel: '12 ноября, чт', startsAt: '14:00', endsAt: '15:20', course: 'Дискретная математика', subject: 'math', format: 'Семинар', room: 'Ауд. 204', teacher: 'Алексей Волков', topic: 'Графы и пути' },
  { id: 'calculus-friday', date: '2026-11-13', dateLabel: '13 ноября, пт', startsAt: '09:00', endsAt: '10:20', course: 'Математический анализ', subject: 'math', format: 'Лекция', room: 'Ауд. 201', teacher: 'Ирина Морозова', topic: 'Свойства непрерывных функций' },
  { id: 'probability-friday', date: '2026-11-13', dateLabel: '13 ноября, пт', startsAt: '10:30', endsAt: '11:50', course: 'Теория вероятностей', subject: 'math', format: 'Семинар', room: 'Ауд. 204', teacher: 'Дмитрий Орлов', topic: 'Решение задач на условную вероятность' },
]
export const seedAssignments: DemoAssignment[] = [
  { id: 'linear-equations', title: 'Множества и комбинаторика', course: 'Дискретная математика', subject: 'math', dueAt: '2026-11-11T23:59:00+03:00', dueLabel: '11 ноя, 23:59', status: 'in-progress', description: 'Решить 6 задач на множества и правила подсчета. Подготовить решения в одном PDF.' },
  { id: 'python-functions', title: 'Функции и работа со строками', course: 'Программирование на Python', subject: 'python', dueAt: '2026-11-12T18:00:00+03:00', dueLabel: '12 ноя, 18:00', status: 'new', description: 'Реализовать 5 функций обработки строк в ноутбуке. Проверить их на примерах из условия.' },
  { id: 'limits', title: 'Пределы и непрерывность', course: 'Математический анализ', subject: 'math', dueAt: '2026-11-13T12:00:00+03:00', dueLabel: '13 ноя, 12:00', status: 'new', description: 'Вычислить 8 пределов и обосновать непрерывность двух функций. Указать ход решения.' },
  { id: 'conditional-probability', title: 'Условная вероятность', course: 'Теория вероятностей', subject: 'math', dueAt: '2026-11-13T23:59:00+03:00', dueLabel: '13 ноя, 23:59', status: 'submitted', description: 'Работа отправлена на проверку: 4 задачи на условную вероятность и формулу Байеса.' },
]
export const seedMaterials: DemoMaterial[] = [
  { id: 'matrices-lecture', title: 'Лекция 3. Множества и комбинаторика', course: 'Дискретная математика', subject: 'math', fileType: 'PDF', path: 'Обучение / Курсы / Дискретная математика / Материалы', description: 'Операции над множествами и примеры комбинаторных задач.' },
  { id: 'python-functions-notes', title: 'Конспект: функции в Python', course: 'Программирование на Python', subject: 'python', fileType: 'IPYNB', path: 'Обучение / Курсы / Программирование на Python / Материалы', description: 'Примеры функций, аргументов и обработки строк.' },
  { id: 'limits-seminar', title: 'Семинар: пределы последовательностей', course: 'Математический анализ', subject: 'math', fileType: 'PDF', path: 'Обучение / Курсы / Математический анализ / Материалы', description: 'Задачи на пределы с разбором основных приемов.' },
  { id: 'probability-lecture', title: 'Лекция: условная вероятность', course: 'Теория вероятностей', subject: 'math', fileType: 'PDF', path: 'Обучение / Курсы / Теория вероятностей / Материалы', description: 'Формула Байеса и примеры условной вероятности.' },
]
