import { EmptyState } from '@/components/ui/empty-state'
import { useState } from 'react'
import { ChevronDown, CirclePlay, Search, UserRound, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterBuilder } from '@/components/ui/filter-builder'
import { matchesFilters, type FilterCondition } from '@/lib/filters'
import { SemanticIcon } from '@/components/ui/semantic-icon'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { courseClasses, courseTeachers, type CourseRecording } from '@/data/courses'
const types = [['all', 'Все типы занятий'], ['lecture', 'Лекция'], ['seminar', 'Семинар'], ['colloquium', 'Коллоквиум']] as const
export default function CourseRecordings({ onOpen }: { onOpen: (recording: CourseRecording) => void }) {
  const { formatDate, formatTime } = useDisplayFormats()
  const [conditions, setConditions] = useState<FilterCondition[]>([])
  const filtered = courseClasses.filter(item => matchesFilters({ date: item.date, teacher: item.teachers, type: item.type }, conditions))
  function reset() { setConditions([]) }
  return <section className="course-recordings course-section" aria-label="Видеозаписи курса">
    <div className="course-section-toolbar"><FilterBuilder fields={[
      { id: 'date', label: 'Дата занятия', options: [...new Set(courseClasses.map(item => item.date))].sort().map(value => ({ value, label: formatDate(value, true) })) },
      { id: 'teacher', label: 'Преподаватель', options: courseTeachers.map(item => ({ value: item.id, label: item.name })) },
      { id: 'type', label: 'Тип занятия', options: types.filter(([value]) => value !== 'all').map(([value, label]) => ({ value, label })) },
    ]} conditions={conditions} onChange={setConditions} label="Фильтры записей" /></div>
    <p className="sr-only" role="status">Занятий: {filtered.length}</p>
    {filtered.length ? <div className="course-recording-list">{filtered.map(item => <details className="course-recording-class" key={item.id}>
      <summary><SemanticIcon icon={Video} tone="blue" size="compact" /><span className="course-class-name">{item.title}</span><span className="course-class-date"><time dateTime={item.date}>{formatDate(item.date, true)}</time><span>{formatTime(item.startsAt)}–{formatTime(item.endsAt)}</span></span><ChevronDown className="course-chevron" aria-hidden="true" /></summary>
      <div className="course-recording-class-content"><ul className="course-teachers" aria-label="Преподаватели занятия">{item.teachers.map(id => {
        const person = courseTeachers.find(value => value.id === id)!
        return <li key={id}><UserRound aria-hidden="true" /><span>{person.name}</span>{person.email ? <a href={`mailto:${person.email}`}>{person.email}</a> : null}</li>
      })}</ul>
      {item.recordings.length ? <ul className="course-recording-files" aria-label="Доступные видеозаписи">{item.recordings.map(recording => <li key={recording.id}><button type="button" onClick={() => onOpen(recording)} aria-label={`Открыть запись: ${recording.title}`}><CirclePlay aria-hidden="true" /><span>{recording.title}</span><time>{recording.duration}</time></button></li>)}</ul>
        : <div className="course-no-recording"><Video aria-hidden="true" /><p>Запись ещё не опубликована</p></div>}
      </div>
    </details>)}</div> : <EmptyState className="course-empty-results" icon={Search} title="Записи не найдены" description="Измени дату, тип занятия или преподавателя." action={<Button type="button" variant="outline" onClick={reset}>Показать все занятия</Button>} />}
  </section>
}
