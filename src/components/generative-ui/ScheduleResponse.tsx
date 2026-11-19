import { resolveHomeworkAssignment } from '@/lib/study-projections'
import WeekStudyPlan from './WeekStudyPlan'
import { useWeekPlan } from '@/hooks/use-week-plan'
import { dayStudyLoad } from '@/lib/week-plan'
import { DeadlineTransfer } from '@/components/late-days/TaskDeadline'
import { useLateDays } from '@/components/LateDaysProvider'
import { SegmentedControl } from '@/components/ui/segmented-control'
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
export default function ScheduleResponse({ part, onNavigate, onRequest }: { part: SchedulePart; onNavigate: (section: string) => void; onRequest?: (query: string) => void }) {
  const { formatTime, formatDate } = useDisplayFormats()
  const [day, setDay] = useState(part.selectedDay)
  const [view, setView] = useState(part.view)
  const isWeek = part.mode === 'week'
  const chosenDay = part.days.find(item => item.date === day)!
  const slots = part.classes.filter(item => item.date === day)
  const records = useHomeworkRecords()
  const { deadline } = useLateDays()
  const personal = useWeekPlan()
  const assignments = part.assignments.map(item => resolveHomeworkAssignment(item, records, deadline(item.id) || item.dueAt))
  const active = assignments.filter(task => task.status !== 'submitted' && !task.personalSkipped)
  const plan = personal.blocks.filter(block => block.week === part.days[0].date && active.some(task => task.id === block.taskId))
  const loads = part.days.map(date => dayStudyLoad(date.date, part.classes, active, plan))
  const deadlines = isWeek ? assignments.filter(item => item.dueAt.startsWith(day)) : []
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
        <div className="gen-deadline"><button type="button" className="gen-deadline-open" onClick={() => onNavigate(`Курсы/${event.homework.courseId}/${event.homework.id}`)} aria-label={`Открыть задание: ${event.homework.title}`}>
          <span className="gen-row-title">{event.homework.title}</span><span className="gen-row-meta">{event.homework.course}</span>
          <span className="gen-deadline-state"><HomeworkModeBadge minutes={academicTasks.find(task => task.id === event.homework.id)?.timeLimitMinutes} /><AssignmentStatusBadge status={event.homework.status} /><DeadlineLabel dueAt={event.homework.dueAt} status={event.homework.status} prefix="Сдать до " timeOnly /></span>
        </button><DeadlineTransfer taskId={event.homework.id} /></div>
      </li>)}
    </ul> : <p className="gen-empty">{view === 'deadlines' ? 'На этот день дедлайнов нет' : view === 'classes' || !isWeek ? 'На этот день занятий нет' : 'На этот день занятий и дедлайнов нет'}</p>}
  </>

  return <section className="gen-ui" aria-label={isWeek ? 'Недельное расписание' : 'Расписание дня'}>
    <div className="gen-header"><h3 className="gen-heading"><SemanticIcon icon={CalendarDays} tone="blue" />{isWeek ? 'Моя неделя' : 'Расписание'}</h3><p>9–15 ноября 2026</p></div>
    {isWeek ? <dl className="gen-week-summary"><div><dt>Занятий на неделе</dt><dd>{part.classes.filter(slot => part.days.some(date => date.date === slot.date)).length}</dd></div><div><dt>Активных заданий</dt><dd>{active.length}</dd></div><div><dt>Сроков на неделе</dt><dd>{loads.reduce((sum, load) => sum + load.deadlines, 0)}</dd></div></dl> : null}
    {isWeek ? <Tabs value={day} onValueChange={setDay} className="min-w-0">
      <TabsList variant="segmented" className="gen-days" aria-label="Дни недели">
        {part.days.map(item => <TabsTrigger key={item.date} value={item.date} className="gen-day-tab" data-load={loads.find(load => load.day === item.date)?.intensity} aria-label={`${item.short}, ${item.label}. Занятия: ${loads.find(load => load.day === item.date)?.classMinutes} мин; твой план: ${loads.find(load => load.day === item.date)?.personalMinutes} мин; несданных работ: ${loads.find(load => load.day === item.date)?.deadlines}`}>
          <span>{item.short}</span><span>{item.label.split(' ')[0]}</span><span className="gen-week-load-mark" aria-hidden="true" />
        </TabsTrigger>)}
      </TabsList>
      <div className="gen-week-note gen-week-legend" aria-label="Обозначения нагрузки"><span><i className="gen-week-key" data-load="low" aria-hidden="true" />Спокойнее</span><span><i className="gen-week-key" data-load="medium" aria-hidden="true" />Плотнее</span><span><i className="gen-week-key" data-load="high" aria-hidden="true" />Возможна перегрузка</span></div>
      <div className="gen-filters"><SegmentedControl aria-label="События недели">
        {([['all', 'Все'], ['classes', 'Занятия'], ['deadlines', 'Дедлайны']] as const).map(([value, label]) => <Button key={value} type="button" size="sm"
          variant={view === value ? 'secondary' : 'ghost'} aria-pressed={view === value} onClick={() => setView(value)}>{label}</Button>)}
      </SegmentedControl></div>
      <TabsContent value={day} className="m-0"><WeekStudyPlan part={part} day={day} assignments={assignments} blocks={personal.blocks} update={personal.update} onNavigate={onNavigate} onRequest={onRequest}>{content}</WeekStudyPlan></TabsContent>
    </Tabs> : content}
    <div className="gen-footer"><Button type="button" variant="outline" onClick={() => { navigate({ scheduleDate: day, scheduleKind: view, scheduleView: 'day', scheduleCourse: 'all', scheduleFormat: 'all', scheduleRoom: 'all', scheduleTeacher: 'all', scheduleConditions: [] }, true); onNavigate('Расписание') }}>Открыть расписание</Button></div>
  </section>
}
