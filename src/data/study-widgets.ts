// Demonstration content for the local prototype, ordered by start time and due date.
export const upcomingClassSlots = [
  {
    id: 'linear-algebra-lecture',
    date: '2026-11-10', dateLabel: '10 ноября, вт', startsAt: '14:00', endsAt: '15:20',
    course: 'Линейная алгебра', format: 'Лекция',
  },
  {
    id: 'python-practice',
    date: '2026-11-10', dateLabel: '10 ноября, вт', startsAt: '15:30', endsAt: '16:50',
    course: 'Программирование на Python', format: 'Практика',
  },
  {
    id: 'calculus-seminar',
    date: '2026-11-11', dateLabel: '11 ноября, ср', startsAt: '09:00', endsAt: '10:20',
    course: 'Математический анализ', format: 'Семинар',
  },
  {
    id: 'probability-lecture',
    date: '2026-11-11', dateLabel: '11 ноября, ср', startsAt: '10:30', endsAt: '11:50',
    course: 'Теория вероятностей', format: 'Лекция',
  },
] as const

export const homeworkDeadlines = [
  {
    id: 'linear-equations', title: 'Матрицы и системы уравнений', course: 'Линейная алгебра',
    dueAt: '2026-11-10T23:59:00+03:00', dueLabel: '10 ноя, 23:59',
  },
  {
    id: 'python-functions', title: 'Функции и работа со строками', course: 'Программирование на Python',
    dueAt: '2026-11-11T18:00:00+03:00', dueLabel: '11 ноя, 18:00',
  },
  {
    id: 'limits', title: 'Пределы и непрерывность', course: 'Математический анализ',
    dueAt: '2026-11-12T12:00:00+03:00', dueLabel: '12 ноя, 12:00',
  },
  {
    id: 'conditional-probability', title: 'Условная вероятность', course: 'Теория вероятностей',
    dueAt: '2026-11-12T23:59:00+03:00', dueLabel: '12 ноя, 23:59',
  },
] as const
