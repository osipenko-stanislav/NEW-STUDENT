export type GradeFormat = 'Обязательный' | 'Факультатив' | 'Вольнослушатель' | 'Внутренний'
export type FormulaRow = { id: string; title: string; average: number; weight: number; completed?: number; total?: number; bonus?: boolean }
export type GradeTask = { id: string; topic: string; title: string; grade: number | null; materialIds?: string[]; activity: string; status: 'Сдано' | 'Отклонено' | 'Не начато' | 'В процессе' | 'На проверке' }
export type GradeStatement = { id: string; courseId?: string; title: string; grade: number | null; semester: number | null; format: GradeFormat | null; archived: boolean; formula?: FormulaRow[]; tasks?: GradeTask[] }
export const gradeSources = {
  file: 'JaZ00ePMPxJp0HN4IDfpZS', student: '4842:161837', calculation: '6176:26538',
  current: '4805:39418', outside: '5484:12353', archive: '4828:18580', earned: '5807:20384', formula: '4901:141799', statistics: '6176:25803',
}
// Values transcribed from the supplied student designs. Displayed totals are calculated,
// as requested, rather than copying the inconsistent total cells in Figma.
export const deepLearningFormula: FormulaRow[] = [
  { id: 'labs', title: 'Лабораторные работы', average: 0, weight: 20 },
  { id: 'competitions', title: 'Соревнования', average: 8, weight: 10 },
  { id: 'tests', title: 'Тесты по лекциям', average: 7, weight: 20 },
  { id: 'homework', title: 'Домашние задания', average: 2, weight: 15 },
  { id: 'project', title: 'Проект', average: 4, weight: 12 },
]
export const statisticsFormula: FormulaRow[] = [
  { id: 'homework', title: 'Домашние задания', average: 0, weight: 20, completed: 7, total: 12 },
  { id: 'test', title: 'Контрольная работа', average: 0, weight: 25, completed: 7, total: 12 },
  { id: 'colloquium', title: 'Коллоквиум', average: 0, weight: 20, completed: 7, total: 12 },
  { id: 'exam', title: 'Экзамен', average: 0, weight: 35, completed: 7, total: 12 },
  { id: 'bonus', title: 'Бонусное домашнее задание', average: 0, weight: 20, completed: 7, total: 12, bonus: true },
]
