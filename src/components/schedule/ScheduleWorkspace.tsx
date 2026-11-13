import { useState, type CSSProperties } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, UserRound, BookOpen, ListFilter } from 'lucide-react'
import { academicClasses, academicTasks } from '@/data/academic-data'
import { courses } from '@/data/course-catalog'
import { useNavigation, navigate } from '@/hooks/use-navigation'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { homeworkStatus } from '@/lib/homework-storage'
import { isHomework } from '@/lib/academic-presentation'
import { homeworkFilterStatus } from '@/lib/homework-filters'
import { addDays, weekDays, moscowDate, minutesAt, classTone, scheduleRangeLabel, filterClasses, layoutCalendarEntries, type ScheduleView } from '@/lib/schedule'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import type { DemoClass } from '@/types/assistant'

type Event = { id: string; date: string; startsAt: string; endsAt: string; title: string; meta: string; tone: string; slot?: DemoClass; taskId?: string; courseId?: string; group?: Event[] }
const deadlineTasks = academicTasks.filter(task => task.enrollmentId === `current-${task.courseId}` && isHomework(task))
const courseNames = new Map(courses.map(course => [course.id, course.title]))
const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ru'))
const formats = unique(academicClasses.map(slot => slot.format))
const rooms = unique(academicClasses.map(slot => slot.room))
const teachers = unique(academicClasses.map(slot => slot.teacher))
const dayName = (date: string, short = false) => new Intl.DateTimeFormat('ru-RU', { weekday: short ? 'short' : 'long', timeZone: 'Europe/Moscow' }).format(new Date(`${date}T12:00:00+03:00`))
function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{label}</SelectItem>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
}
export default function ScheduleWorkspace({ onNavigate }: { onNavigate: (destination: string) => void }) {
  const state = useNavigation()
  const mobile = useIsMobile()
  const today = moscowDate()
  const date = state.scheduleDate ?? today
  const view = state.scheduleView ?? (mobile ? 'day' : 'week')
  const [slot, setSlot] = useState<DemoClass | null>(null)
  const [eventGroup, setEventGroup] = useState<Event[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { formatTime, formatDate } = useDisplayFormats()
  const records = useHomeworkRecords()
  const week = weekDays(date)
  const monthStart = `${date.slice(0, 7)}-01`
  const monthEnd = addDays(`${date.slice(0, 7)}-${new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 0).getDate()}`, 0)
  const dates = view === 'week' ? week : view === 'two-days' ? [date, addDays(date, 1)] : view === 'list' ? Array.from({ length: Number(monthEnd.slice(-2)) }, (_, i) => addDays(monthStart, i)) : [date]
  const filteredSlots = filterClasses(academicClasses, { course: state.scheduleCourse, format: state.scheduleFormat, room: state.scheduleRoom, teacher: state.scheduleTeacher })
  const events: Event[] = [
    ...(state.scheduleKind !== 'deadlines' ? filteredSlots.map(item => ({ id: item.id, date: item.date, startsAt: item.startsAt, endsAt: item.endsAt, title: item.course, meta: `${item.format} · ${item.room}`, tone: classTone(item.format), slot: item, courseId: item.courseId })) : []),
    ...(state.scheduleKind !== 'classes' ? deadlineTasks.filter(task => (state.scheduleCourse === 'all' || task.courseId === state.scheduleCourse) && homeworkFilterStatus(homeworkStatus(task, records[task.id])) !== 'submitted').map(task => ({ id: `deadline-${task.id}`, date: task.dueAt.slice(0, 10), startsAt: task.dueAt.slice(11, 16), endsAt: `${String(Math.min(24, Math.floor((minutesAt(task.dueAt.slice(11, 16)) + 45) / 60))).padStart(2, '0')}:${String(Math.min(1440, minutesAt(task.dueAt.slice(11, 16)) + 45) % 60).padStart(2, '0')}`, title: task.title, meta: courseNames.get(task.courseId)!, tone: 'red', taskId: task.id, courseId: task.courseId })) : []),
  ].filter(event => dates.includes(event.date)).sort((a, b) => a.date.localeCompare(b.date) || a.startsAt.localeCompare(b.startsAt) || a.title.localeCompare(b.title, 'ru'))
  const gridEvents = events.filter(event => !event.taskId)
  const deadlineGroups = new Map<string, Event[]>()
  for (const event of events.filter(event => event.taskId)) {
    const key = `${event.date}/${event.startsAt}`
    deadlineGroups.set(key, [...(deadlineGroups.get(key) ?? []), event])
  }
  for (const group of deadlineGroups.values()) gridEvents.push(group.length > 1
    ? { ...group[0], title: `Дедлайны: ${group.length}`, meta: 'Открыть задания', group }
    : group[0])
  const startHour = Math.min(9, ...events.map(event => Math.floor(minutesAt(event.startsAt) / 60)))
  const endHour = Math.min(24, Math.max(19, ...events.map(event => Math.ceil(minutesAt(event.endsAt) / 60))))
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
  const filterCount = [state.scheduleCourse, ...(state.scheduleKind === 'deadlines' ? [] : [state.scheduleFormat, state.scheduleRoom, state.scheduleTeacher])].filter(value => value !== 'all').length
  function chooseDate(scheduleDate: string) { navigate({ scheduleDate }, true) }
  function move(direction: number) {
    if (view === 'list') {
      const next = new Date(`${date}T12:00:00Z`); next.setUTCDate(1); next.setUTCMonth(next.getUTCMonth() + direction); chooseDate(next.toISOString().slice(0, 10))
    } else chooseDate(addDays(date, direction * (view === 'week' ? 7 : view === 'two-days' ? 2 : 1)))
  }
  function resetFilters() { navigate({ scheduleCourse: 'all', scheduleFormat: 'all', scheduleRoom: 'all', scheduleTeacher: 'all' }, true) }
  function open(event: Event) { if (event.group) setEventGroup(event.group); else if (event.slot) setSlot(event.slot); else onNavigate(`Курсы/${event.courseId}/${event.taskId}`) }
  const filters = <>
    <Filter label="Все курсы" value={state.scheduleCourse} onChange={scheduleCourse => navigate({ scheduleCourse }, true)} options={courses.map(course => ({ value: course.id, label: course.title }))} />
    {state.scheduleKind !== 'deadlines' ? <><Filter label="Все типы занятий" value={state.scheduleFormat} onChange={scheduleFormat => navigate({ scheduleFormat }, true)} options={formats.map(value => ({ value, label: value }))} />
    <Filter label="Все аудитории" value={state.scheduleRoom} onChange={scheduleRoom => navigate({ scheduleRoom }, true)} options={rooms.map(value => ({ value, label: value }))} />
    <Filter label="Все преподаватели" value={state.scheduleTeacher} onChange={scheduleTeacher => navigate({ scheduleTeacher }, true)} options={teachers.map(value => ({ value, label: value }))} /></> : null}
    {filterCount ? <Button variant="ghost" onClick={resetFilters}>Сбросить фильтры</Button> : null}
  </>
  return <section className="study-page schedule-page" aria-labelledby="schedule-title">
    <header className="study-page-header"><div><h1 id="schedule-title">Расписание</h1><p>Время московское</p></div></header>
    <Card className="schedule-surface">
      <div className="schedule-toolbar">
        <div className="schedule-date-navigation">
          <Button variant="outline" size="icon" aria-label="Предыдущий период" onClick={() => move(-1)}><ChevronLeft aria-hidden="true" /></Button>
          <Button variant="outline" onClick={() => chooseDate(today)}>Сегодня</Button>
          <Button variant="outline" size="icon" aria-label="Следующий период" onClick={() => move(1)}><ChevronRight aria-hidden="true" /></Button>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}><PopoverTrigger asChild><Button variant="ghost" className="schedule-date-picker"><CalendarDays aria-hidden="true" /><span>{view === 'list' ? new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' }).format(new Date(`${date}T12:00:00+03:00`)) : scheduleRangeLabel(dates[0], dates.at(-1)!)}</span></Button></PopoverTrigger><PopoverContent align="start" className="schedule-date-popover"><label htmlFor="schedule-date-input" className="text-sm font-medium">Выбери дату</label><Input id="schedule-date-input" type="date" value={date} onChange={event => { if (/^\d{4}-\d{2}-\d{2}$/.test(event.target.value)) chooseDate(event.target.value) }} /><Button variant="outline" onClick={() => setPickerOpen(false)}>Готово</Button></PopoverContent></Popover>
        </div>
        <Select value={view} onValueChange={value => navigate({ scheduleView: value as ScheduleView }, true)}><SelectTrigger className="schedule-view-select" aria-label="Вид расписания"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="week">Неделя</SelectItem><SelectItem value="day">День</SelectItem><SelectItem value="two-days">Два дня</SelectItem><SelectItem value="list">Список за месяц</SelectItem></SelectContent></Select>
      </div>
      <div className="schedule-controls"><div className="schedule-event-kinds" role="group" aria-label="События расписания">{([['all', 'Все'], ['classes', 'Занятия'], ['deadlines', 'Дедлайны']] as const).map(([kind, label]) => <Button key={kind} variant={state.scheduleKind === kind ? 'secondary' : 'ghost'} aria-pressed={state.scheduleKind === kind} onClick={() => navigate({ scheduleKind: kind }, true)}>{label}</Button>)}</div>
        <Button variant="outline" className="schedule-mobile-filter" onClick={() => setFiltersOpen(true)}><ListFilter aria-hidden="true" />Фильтры{filterCount ? <Badge variant="neutral">{filterCount}</Badge> : null}</Button>
        <p className="sr-only" role="status">Событий: {events.length}</p>
      </div>
      {view !== 'list' ? <div className="schedule-week-strip" role="group" aria-label="Дни недели">{week.map(day => <Button key={day} variant={day === date ? 'default' : 'ghost'} aria-pressed={day === date} aria-current={day === today ? 'date' : undefined} onClick={() => chooseDate(day)}><span>{dayName(day, true)}</span><strong>{Number(day.slice(-2))}</strong></Button>)}</div> : null}
      {!events.length ? <div className="study-empty"><CalendarDays aria-hidden="true" /><h2>На этот период событий нет</h2><p>{filterCount ? 'Измени фильтры или выбери другую дату.' : 'Выбери другую дату в календаре.'}</p>{filterCount ? <Button variant="outline" onClick={resetFilters}>Сбросить фильтры</Button> : null}</div> : view === 'list' ? <div className="schedule-agenda">{dates.filter(day => events.some(event => event.date === day)).map(day => <section key={day} className="schedule-agenda-day"><h2>{formatDate(day)}<span>{dayName(day)}</span></h2><ul>{events.filter(event => event.date === day).map(event => <li key={event.id}><time>{formatTime(event.startsAt)}{event.slot ? `–${formatTime(event.endsAt)}` : ''}</time><button className="schedule-agenda-event" onClick={() => open(event)}><Badge variant={event.slot ? 'neutral' : 'danger'}>{event.slot?.format ?? 'Дедлайн'}</Badge><strong>{event.title}</strong><span>{event.meta}</span>{event.slot ? <span>{event.slot.teacher}</span> : null}</button></li>)}</ul></section>)}</div>
      : <div className="schedule-grid-scroll"><div className={`schedule-grid schedule-view-${view}`} style={{ '--schedule-days': dates.length } as CSSProperties}>
        <div className="schedule-grid-corner">МСК</div>{dates.map(day => <button key={day} className="schedule-grid-day" aria-current={day === today ? 'date' : undefined} onClick={() => { navigate({ scheduleDate: day, scheduleView: 'day' }, true) }}><span>{dayName(day, true)}</span><strong>{Number(day.slice(-2))}</strong></button>)}
        <div className="schedule-time-axis" style={{ height: (endHour - startHour) * 76 }}>{hours.map(hour => <span key={hour} style={{ top: (hour - startHour) * 76 }}>{String(hour).padStart(2, '0')}:00</span>)}</div>
        {dates.map(day => <div key={day} className="schedule-day-column" style={{ height: (endHour - startHour) * 76 }}>{layoutCalendarEntries(gridEvents.filter(event => event.date === day)).map(({ entry, lane, lanes }) => <button key={entry.id} className="schedule-class-event" data-tone={entry.tone} style={{ top: Math.min((minutesAt(entry.startsAt) - startHour * 60) / 60 * 76, (endHour - startHour) * 76 - (entry.taskId ? 68 : 52)), height: entry.taskId ? 64 : Math.max(52, (minutesAt(entry.endsAt) - minutesAt(entry.startsAt)) / 60 * 76 - 4), left: `calc(${lane / lanes * 100}% + 3px)`, width: `calc(${100 / lanes}% - 6px)` }} onClick={() => open(entry)} aria-label={`${entry.taskId ? 'Дедлайн. ' : ''}${entry.title}, ${entry.meta}, ${formatTime(entry.startsAt)}${entry.slot ? `–${formatTime(entry.endsAt)}` : ''}`}><time>{entry.taskId ? 'Дедлайн · ' : ''}{formatTime(entry.startsAt)}{entry.slot ? `–${formatTime(entry.endsAt)}` : ''}</time><strong>{entry.title}</strong><span>{entry.meta}</span>{entry.slot ? <span>{entry.slot.teacher}</span> : null}</button>)}</div>)}
      </div></div>}
      <footer className="schedule-legend">{['Лекция', 'Семинар', 'Практика'].map(format => <span key={format}><i data-tone={classTone(format)} />{format}</span>)}<span><i data-tone="red" />Дедлайн</span></footer>
    </Card>
    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}><SheetContent className="schedule-filter-sheet"><SheetHeader><SheetTitle>Фильтры расписания</SheetTitle><SheetDescription>{state.scheduleKind === 'deadlines' ? 'Выбери курс.' : 'Выбери курс и параметры занятия.'}</SheetDescription></SheetHeader><div className="schedule-filter-sheet-fields">{filters}</div><Button onClick={() => setFiltersOpen(false)}>Показать расписание</Button></SheetContent></Sheet>
    <Sheet open={Boolean(eventGroup.length)} onOpenChange={open => { if (!open) setEventGroup([]) }}><SheetContent className="schedule-details"><SheetHeader><SheetTitle>Дедлайны в одно время</SheetTitle><SheetDescription>{eventGroup[0] ? `${formatDate(eventGroup[0].date)} · ${formatTime(eventGroup[0].startsAt)} МСК` : ''}</SheetDescription></SheetHeader><ul className="schedule-group-list">{eventGroup.map(event => <li key={event.id}><button className="schedule-agenda-event" onClick={() => { setEventGroup([]); onNavigate(`Курсы/${event.courseId}/${event.taskId}`) }}><strong>{event.title}</strong><span>{event.meta}</span></button></li>)}</ul></SheetContent></Sheet>
    <Sheet open={Boolean(slot)} onOpenChange={open => { if (!open) setSlot(null) }}><SheetContent className="schedule-details"><SheetHeader><SheetTitle>{slot?.course}</SheetTitle><SheetDescription>{slot?.format}</SheetDescription></SheetHeader>{slot ? <><p className="schedule-detail-topic">{slot.topic}</p><dl><div><dt><CalendarDays aria-hidden="true" />Дата</dt><dd>{formatDate(slot.date)} · {dayName(slot.date)}</dd></div><div><dt><Clock3 aria-hidden="true" />Время</dt><dd>{formatTime(slot.startsAt)}–{formatTime(slot.endsAt)} МСК</dd></div><div><dt><MapPin aria-hidden="true" />Аудитория</dt><dd>{slot.room}</dd></div><div><dt><UserRound aria-hidden="true" />Преподаватель</dt><dd>{slot.teacher}</dd></div></dl><Button onClick={() => { setSlot(null); onNavigate(`Курсы/${slot.courseId}`) }}><BookOpen aria-hidden="true" />Открыть курс</Button></> : null}</SheetContent></Sheet>
  </section>
}
