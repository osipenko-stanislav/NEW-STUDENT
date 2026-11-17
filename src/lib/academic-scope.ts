export type AcademicScope = 'semester' | 'outside' | 'archive'
export function academicScope(item: { archived: boolean; semester: number | null }): AcademicScope {
  return item.archived ? 'archive' : item.semester === null ? 'outside' : 'semester'
}
