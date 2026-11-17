import { gradeStatements } from './academic-data.ts'
import { getCourse } from './course-catalog.ts'

export type GradebookSession = {
  id: string
  season: 'winter' | 'summer'
  year: number
  rows: { id: string; title: string; control: string; grade: number | string | null }[]
}

// Historical session fixtures; summer results reuse the shared archived statements.
// Winter results are illustrative completed first-semester records, not current grades.
const winterResults = [
  { courseId: 'python-basic', control: 'Экзамен', grade: 8 },
  { courseId: 'discrete-math', control: 'Экзамен', grade: 7 },
  { courseId: 'algorithms', control: 'Экзамен', grade: 8 },
  { courseId: 'probability', control: 'Зачет', grade: 'Зачтено' },
] as const
export const gradebookSessions: GradebookSession[] = [
  { id: 'summer-2026', season: 'summer', year: 2026,
    rows: gradeStatements.filter(statement => statement.archived && statement.semester === 2).map(statement => ({
      id: statement.id, title: statement.title, control: 'Экзамен', grade: statement.grade,
    })),
  },
  { id: 'winter-2026', season: 'winter', year: 2026,
    rows: winterResults.map(result => ({ id: `winter-2026-${result.courseId}`, title: getCourse(result.courseId).title, control: result.control, grade: result.grade })),
  },
]
