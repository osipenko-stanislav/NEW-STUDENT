import { useState } from 'react'
import { ChevronDown, CirclePlay, Search, UserRound, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SemanticIcon } from '@/components/ui/semantic-icon'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { courseClasses, courseTeachers, type CourseRecording } from '@/data/courses'
const types = [['all', 'Все типы занятий'], ['lecture', 'Лекция'], ['seminar', 'Семинар'], ['colloquium', 'Коллоквиум']] as const
function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{options.map(([id, title]) => <SelectItem key={id} value={id}>{title}</SelectItem>)}</SelectContent></Select>
}
export default function CourseRecordings({ onOpen }: { onOpen: (recording: CourseRecording) => void }) {
  const { formatDate, formatTime } = useDisplayFormats()
  const [date, setDate] = useState('all')
  const [teacher, setTeacher] = useState('all')
  const [type, setType] = useState('all')
  const filtered = courseClasses.filter(item => (date === 'all' || item.date === date) && (teacher === 'all' || item.teachers.includes(teacher)) && (type === 'all' || item.type === type))
  const active = date !== 'all' || teacher !== 'all' || type !== 'all'
  function reset() { setDate('all'); setTeacher('all'); setType('all') }
  return <section className="course-recordings course-section" aria-label="Видеозаписи курса">
    <div className="course-recording-filters"><Filter label="Дата занятия" value={date} onChange={setDate} options={[["all", "Все даты"], ...[...new Set(courseClasses.map(item => item.date))].sort().map(value => [value, formatDate(value, true)] as const)]} />
      <Filter label="Преподаватель" value={teacher} onChange={setTeacher} options={[["all", "Все преподаватели"], ...courseTeachers.map(item => [item.id, item.name] as const)]} />
      <Filter label="Тип занятия" value={type} onChange={setType} options={types} /></div>
    <p className="sr-only" role="status">Занятий: {filtered.length}</p>{active ? <div className="course-recording-results"><Button type="button" variant="ghost" size="sm" onClick={reset}>Сбросить фильтры</Button></div> : null}
    {filtered.length ? <div className="course-recording-list">{filtered.map(item => <details className="course-recording-class" key={item.id}>
      <summary><SemanticIcon icon={Video} tone="blue" size="compact" /><span className="course-class-name">{item.title}</span><span className="course-class-date"><time dateTime={item.date}>{formatDate(item.date, true)}</time><span>{formatTime(item.startsAt)}–{formatTime(item.endsAt)}</span></span><ChevronDown className="course-chevron" aria-hidden="true" /></summary>
      <div className="course-recording-class-content"><ul className="course-teachers" aria-label="Преподаватели занятия">{item.teachers.map(id => {
        const person = courseTeachers.find(value => value.id === id)!
        return <li key={id}><UserRound aria-hidden="true" /><span>{person.name}</span>{person.email ? <a href={`mailto:${person.email}`}>{person.email}</a> : null}</li>
      })}</ul>
      {item.recordings.length ? <ul className="course-recording-files" aria-label="Доступные видеозаписи">{item.recordings.map(recording => <li key={recording.id}><button type="button" onClick={() => onOpen(recording)} aria-label={`Открыть запись: ${recording.title}`}><CirclePlay aria-hidden="true" /><span>{recording.title}</span><time>{recording.duration}</time></button></li>)}</ul>
        : <div className="course-no-recording"><Video aria-hidden="true" /><p>Запись ещё не опубликована</p></div>}
      </div>
    </details>)}</div> : <div className="course-empty-results"><Search aria-hidden="true" /><h2>Записи не найдены</h2><p>Измени дату, тип занятия или преподавателя.</p><Button type="button" variant="outline" onClick={reset}>Показать все занятия</Button></div>}
  </section>
}
