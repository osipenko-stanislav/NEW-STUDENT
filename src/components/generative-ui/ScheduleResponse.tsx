import { navigate } from '@/hooks/use-navigation'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { academicTasks } from '@/data/academic-data'
import HomeworkModeBadge from '@/components/courses/HomeworkModeBadge'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { useState } from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { SemanticIcon } from '@/components/ui/semantic-icon'
import { isAssignmentOverdue } from '@/lib/assignment-presentation'
import DeadlineLabel from '@/components/DeadlineLabel'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssignmentStatusBadge } from './AssignmentDetails'
import type { DemoClass, SchedulePart } from '@/types/assistant'

function ClassRow({ slot }: { slot: DemoClass }) {
  const { formatTime } = useDisplayFormats()
  return <li className="gen-event" data-event="class">
    <div className="gen-event-time"><time dateTime={`${slot.date}T${formatTime(slot.startsAt)}:00+03:00`}>{formatTime(slot.startsAt)}</time><span>{formatTime(slot.endsAt)}</span></div>
    <details className="gen-class-details">
      <summary><span className="min-w-0"><span className="gen-row-title">{slot.course}</span><span className="gen-row-meta">{slot.room} · {slot.format}</span></span><ChevronDown className="gen-chevron" aria-hidden="true" /></summary>
      <div className="gen-detail"><p>{slot.topic}</p><p className="mt-1 text-muted-foreground">Преподаватель: {slot.teacher}</p></div>
    </details>
  </li>
}
export default function ScheduleResponse({ part, onNavigate }: { part: SchedulePart; onNavigate: (section: string) => void }) {
  const { formatTime, formatDate } = useDisplayFormats()
  const [day, setDay] = useState(part.selectedDay)
  const [view, setView] = useState(part.view)
  const isWeek = part.mode === 'week'
  const chosenDay = part.days.find(item => item.date === day)!
  const slots = part.classes.filter(item => item.date === day)
  const records = useHomeworkRecords()
  const deadlines = isWeek ? part.assignments.map(item => ({ ...item, status: records[item.id]?.submittedAt ? 'submitted' as const : records[item.id]?.savedAt || records[item.id]?.startedAt ? 'in-progress' as const : item.status })).filter(item => item.dueAt.startsWith(day)) : []
  const events = [
    ...(view !== 'deadlines' ? slots.map(slot => ({ time: slot.startsAt, id: slot.id, slot })) : []),
    ...(view !== 'classes' ? deadlines.map(homework => ({ time: homework.dueAt.slice(11, 16), id: homework.id, homework })) : []),
  ].sort((a, b) => a.time.localeCompare(b.time))

  const content = <>
    <div className="gen-day-label">{formatDate(chosenDay.date, true)} · МСК</div>
    {events.length ? <ul className="gen-event-list" aria-label={`События: ${chosenDay.label}`}>
      {events.map(event => 'slot' in event ? <ClassRow key={event.id} slot={event.slot} /> : <li key={event.id} className="gen-event" data-event="deadline"
        data-overdue={isAssignmentOverdue(event.homework.dueAt, event.homework.status)}>
        <div className="gen-event-time"><time dateTime={event.homework.dueAt}>{formatTime(event.time)}</time><span>Сдать до</span></div>
        <button type="button" className="gen-deadline" onClick={() => onNavigate(`Курсы/${event.homework.courseId}/${event.homework.id}`)} aria-label={`Открыть задание: ${event.homework.title}`}>
          <span className="gen-row-title">{event.homework.title}</span><span className="gen-row-meta">{event.homework.course}</span>
          <span className="gen-deadline-state"><HomeworkModeBadge minutes={academicTasks.find(task => task.id === event.homework.id)?.timeLimitMinutes} /><AssignmentStatusBadge status={event.homework.status} /><DeadlineLabel dueAt={event.homework.dueAt} status={event.homework.status} prefix="Сдать до " timeOnly /></span>
        </button>
      </li>)}
    </ul> : <p className="gen-empty">{view === 'deadlines' ? 'На этот день дедлайнов нет' : view === 'classes' || !isWeek ? 'На этот день занятий нет' : 'На этот день занятий и дедлайнов нет'}</p>}
  </>

  return <section className="gen-ui" aria-label={isWeek ? 'Недельное расписание' : 'Расписание дня'}>
    <div className="gen-header"><h3 className="gen-heading"><SemanticIcon icon={CalendarDays} tone="blue" />{isWeek ? 'Моя неделя' : 'Расписание'}</h3><p>9–15 ноября 2026</p></div>
    {isWeek ? <Tabs value={day} onValueChange={setDay} className="min-w-0">
      <TabsList variant="segmented" className="gen-days" aria-label="Дни недели">
        {part.days.map(item => <TabsTrigger key={item.date} value={item.date} className="gen-day-tab" aria-label={`${item.short}, ${item.label}`}>
          <span>{item.short}</span><span>{item.label.split(' ')[0]}</span>
        </TabsTrigger>)}
      </TabsList>
      <div className="gen-filters" role="group" aria-label="События недели">
        {([['all', 'Все'], ['classes', 'Занятия'], ['deadlines', 'Дедлайны']] as const).map(([value, label]) => <Button key={value} type="button" size="sm"
          variant={view === value ? 'secondary' : 'ghost'} aria-pressed={view === value} onClick={() => setView(value)}>{label}</Button>)}
      </div>
      <TabsContent value={day} className="m-0">{content}</TabsContent>
    </Tabs> : content}
    <div className="gen-footer"><Button type="button" variant="outline" onClick={() => { navigate({ scheduleDate: day, scheduleKind: view, scheduleView: 'day' }, true); onNavigate('Расписание') }}>Открыть расписание</Button></div>
  </section>
}
