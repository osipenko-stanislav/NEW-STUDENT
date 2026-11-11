import { demoAssignments, demoClasses, demoToday } from './study-demo.ts'

// The widgets and assistant use the same fixed demonstration week.
export const upcomingClassSlots = demoClasses.filter(slot => slot.date >= demoToday).slice(0, 4)
export const homeworkDeadlines = demoAssignments
