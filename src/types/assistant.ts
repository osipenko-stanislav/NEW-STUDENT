export type AssignmentStatus = 'new' | 'in-progress' | 'submitted'
export type AssignmentFilter = 'all' | 'active' | AssignmentStatus
export type CourseFilter = 'all' | 'math' | 'python'
export type DemoClass = {
  id: string; date: string; dateLabel: string; startsAt: string; endsAt: string
  course: string; subject: Exclude<CourseFilter, 'all'>; format: string; room: string; teacher: string; topic: string
}
export type DemoAssignment = {
  id: string; title: string; course: string; subject: Exclude<CourseFilter, 'all'>
  dueAt: string; dueLabel: string; status: AssignmentStatus; description: string
}
export type DemoMaterial = {
  id: string; title: string; course: string; subject: Exclude<CourseFilter, 'all'>
  fileType: 'PDF' | 'IPYNB'; path: string; description: string
}
export type DemoDay = { date: string; short: string; label: string }
export type SchedulePart = {
  type: 'schedule'; version: 1; mode: 'day' | 'week'; days: DemoDay[]; selectedDay: string
  view: 'all' | 'classes' | 'deadlines'; classes: DemoClass[]; assignments: DemoAssignment[]
}
export type AssignmentsPart = {
  type: 'assignments'; version: 1; items: DemoAssignment[]; filter: AssignmentFilter; subject: CourseFilter
}
export type MaterialsPart = {
  type: 'materials'; version: 1; items: DemoMaterial[]; query: string; subject: CourseFilter; fileType: 'all' | 'PDF' | 'IPYNB'
}
export type GenerativePart = SchedulePart | AssignmentsPart | MaterialsPart
export type MockContext = {
  scenario: 'schedule' | 'week' | 'assignments' | 'materials'
  day: string; subject: CourseFilter
}
export type GenerationState = { messageId: string; visibleCharacters: number; phase: 'thinking' | 'typing' }
