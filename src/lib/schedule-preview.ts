import type { DemoClass } from '../types/assistant.ts'
import type { AcademicTask } from '../data/academic-data.ts'
import { moscowDate } from './schedule.ts'
import { homeworkFilterStatus } from './homework-filters.ts'

export type SchedulePreviewEvent = {
  id: string
  kind: 'class' | 'deadline'
  at: string
  endsAt?: string
  title: string
  detail: string
  courseId: string
}

// Callers supply effective deadlines and statuses from the shared providers.
export function upcomingTodayEvents(classes: DemoClass[], tasks: Pick<AcademicTask, 'id' | 'title' | 'courseId' | 'dueAt' | 'status'>[], now: Date): SchedulePreviewEvent[] {
  const today = moscowDate(now)
  return [
    ...classes.filter(slot => slot.date === today && new Date(`${slot.date}T${slot.endsAt}:00+03:00`) > now).map(slot => ({
      id: slot.id, kind: 'class' as const, at: `${slot.date}T${slot.startsAt}:00+03:00`, endsAt: slot.endsAt,
      title: slot.course, detail: `${slot.format} · ${slot.room}`, courseId: slot.courseId!,
    })),
    ...tasks.filter(task => moscowDate(new Date(task.dueAt)) === today && new Date(task.dueAt) >= now && homeworkFilterStatus(task.status) !== 'submitted').map(task => ({
      id: task.id, kind: 'deadline' as const, at: task.dueAt, title: task.title, detail: 'Дедлайн', courseId: task.courseId,
    })),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id))
}
