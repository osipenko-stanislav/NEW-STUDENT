export type SearchCategory = 'all' | 'courses' | 'lessons' | 'materials' | 'homework' | 'grades' | 'handbook' | 'sections'
export type SearchItem = {
  id: string
  courseId?: string
  lessonId?: string
  blockId?: string
  taskId?: string
  materialId?: string
  statementId?: string
  handbookPageId?: string
  title: string
  path: string
  content?: string
  category: Exclude<SearchCategory, 'all'>
  icon: string
  section: string
  fileType?: string
}
