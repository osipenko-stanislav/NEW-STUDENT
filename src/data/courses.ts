export * from './course-content.ts'
import { academicMaterials, assistantAssignments } from './academic-data.ts'
import { featuredCourseId } from './course-catalog.ts'
export type LearningMaterial = { id: string; title: string; type: 'pdf' | 'md' | 'ipynb'; sizeLabel: string; url: string; demo?: boolean }
export const learningMaterials: LearningMaterial[] = academicMaterials.filter(item => item.courseId === featuredCourseId).map(item => ({ ...item, type: item.fileType.toLowerCase() as LearningMaterial['type'] }))
const assignment = assistantAssignments.find(item => item.courseId === featuredCourseId)!
export const courseAssignment = { ...assignment, status: assignment.status === 'new' ? 'Не начато' : assignment.status === 'submitted' ? 'На проверке' : 'В процессе', points: 10 }
