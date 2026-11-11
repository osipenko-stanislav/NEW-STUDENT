import { navigation, secondaryNavigation } from '@/data/navigation'
import { homeworkDeadlines, upcomingClassSlots } from '@/data/study-widgets'
import { demoMaterials } from './study-demo.ts'
import type { SearchItem } from '@/types/search'

export const sectionSearchItems: SearchItem[] = [...navigation, ...secondaryNavigation].flatMap(item =>
  item.children
    ? item.children.map(title => ({
      id: `section-${title}`, title, path: `LMS / ${item.title}`, category: 'sections' as const,
      icon: item.icon, section: title,
    }))
    : [{ id: `section-${item.title}`, title: item.title, path: 'LMS', category: 'sections' as const,
      icon: item.icon, section: item.title }],
)

export const searchItems: SearchItem[] = [
  ...sectionSearchItems,
  ...upcomingClassSlots.map(slot => ({
    id: `course-${slot.id}`, title: slot.course, path: 'LMS / Обучение / Курсы', category: 'courses' as const,
    icon: 'book-open01-lined.svg', section: 'Курсы', demo: true,
  })),
  ...demoMaterials.map(material => ({
    id: `material-${material.id}`, title: material.title,
    path: `LMS / Обучение / Курсы / ${material.course} / Материалы`, category: 'materials' as const,
    icon: 'file06-lined.svg', section: 'Курсы', demo: true,
  })),
  ...homeworkDeadlines.map(homework => ({
    id: `homework-${homework.id}`, title: homework.title,
    path: `LMS / Обучение / Домашки / ${homework.course}`, category: 'homework' as const,
    icon: 'file06-lined.svg', section: 'Домашки', demo: true,
  })),
]

export const quickSearchSections = ['Навигатор', 'Расписание', 'Курсы', 'Домашки', 'Мои цели', 'Хэндбук', 'События', 'Настройки']
