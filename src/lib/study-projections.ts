import { academicMaterials, assistantAssignments, assistantClasses } from '../data/academic-data.ts'
import type { GenerativePart } from '../types/assistant.ts'
// Stored chat blocks contain snapshots. Resolve records by stable ID at render time,
// so restored cards use the same current titles, files and task states as course pages.
export function resolveStudyPart(part: GenerativePart): GenerativePart {
  switch (part.type) {
    case 'materials': return { ...part, items: part.items.flatMap(item => academicMaterials.find(current => current.id === item.id) ?? []) }
    case 'assignments': return { ...part, items: part.items.flatMap(item => assistantAssignments.find(current => current.id === item.id) ?? []) }
    case 'schedule': return { ...part, classes: part.classes.flatMap(item => assistantClasses.find(current => current.id === item.id) ?? []), assignments: part.assignments.flatMap(item => assistantAssignments.find(current => current.id === item.id) ?? []) }
  }
}
