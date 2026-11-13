type NavigationItem = { title: string; icon: string; children?: readonly string[] }

export const navigation: readonly NavigationItem[] = [
  { title: 'Навигатор', icon: 'compass03-lined.svg' },
  { title: 'Мои цели', icon: 'target04-lined.svg' },
  { title: 'Обучение', icon: 'book-open01-lined.svg', children: [
    'Курсы', 'Late Days', 'Учебный план', 'Ведомости', 'Зачетка', 'Домашки', 'Запись на пары', 'Посещаемость', 'Выбор курсов',
  ] },
  { title: 'Карьера', icon: 'briefcase-business-lined.svg', children: ['Профили', 'Вакансии', 'Отклики'] },
  { title: 'Расписание', icon: 'calendar-lined.svg' },
  { title: 'Хэндбук', icon: 'file06-lined.svg' },
  { title: 'События', icon: 'announcement01-lined.svg' },
  { title: 'Сервисы', icon: 'presentation-chart02-lined.svg', children: ['Time', 'Онлайн-запись', 'It-сервисы', 'Поддержка'] },
]

export const secondaryNavigation: readonly NavigationItem[] = [
  { title: 'Настройки', icon: 'settings01-lined.svg' },
]
