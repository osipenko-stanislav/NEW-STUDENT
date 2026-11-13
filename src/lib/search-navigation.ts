import type { SearchItem } from '../types/search.ts'
import type { NavigationState } from '../hooks/use-navigation.ts'

// Search results carry entity IDs, never infer a destination from a display title.
export function navigationForSearch(item: SearchItem): Partial<NavigationState> {
  return {
    section: item.section, studyTarget: item.courseId,
    courseId: item.section === 'Курсы' ? item.courseId ?? null : null,
    taskId: item.taskId ?? null, lessonId: item.lessonId ?? null,
    materialId: item.materialId ?? null, originBlockId: item.blockId ?? 'block-1',
    courseTab: item.materialId ? 'materials' : item.taskId ? 'homework' : 'course',
    statementId: item.statementId ?? null, gradeTab: 'formula',
    handbookPageId: item.handbookPageId ?? null, handbookAnchor: null,
  }
}
