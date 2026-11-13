# Schedule and all homework

Mode: Operate. Extend the incumbent shadcn/ui world: existing PT Root UI, theme variables, Lucide icons, semantic status tones and primitives. Figma is UX structure only; preserve the existing app shell.

Schedule: week, day, two-day and monthly agenda, date navigation/picker, today, intersecting course/type/room/teacher filters, class details and course links. Mobile defaults to a day plus week strip. The user confirmed classes and homework deadlines, with an event-kind switch. Existing shared academic records supply both. Do not fabricate group memberships, recurrence rules, meeting URLs or academic terms absent from records.

All homework: current enrollment homework only, including reviewed work; no archived duplicate tasks. The status select is shared with chat: all, active, new, in-progress, submitted. Accepted counts as submitted; rejected counts as in progress because another attempt is required. Detailed task badges retain their original states. Live saved/started/submitted records update the list. Task actions open the actual course assignment and browser Back restores the list filters.

Source: src/components/schedule/ScheduleWorkspace.tsx; src/components/homework/HomeworkWorkspace.tsx; src/components/AssignmentStatusFilter.tsx; src/lib/schedule.ts; src/lib/homework-filters.ts; src/study-pages.css.

Deadlines occupy the shared time grid at their due time (explicit user correction), with no separate deadline row. Identical due timestamps collapse into a labeled group opening a task picker. Deadline accessible names report an instant, not the internal display duration.
