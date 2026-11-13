import { BookOpen, CalendarClock, ChevronRight, List, GraduationCap, MessageCircle, CircleHelp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { statementForCourse, assistantAssignments } from '@/data/academic-data'
import { calculateGrade, formatGrade } from '@/lib/grade-calculation'
import { featuredCourseId } from '@/data/course-catalog'
import { courseAssignment } from '@/data/courses'
import type { CourseDialog } from './CourseDialogs'
export type TocEntry = { id: string; title: string; depth?: number }
export default function CourseWidgets({ onDialog, onProgram, programOpen, toc, activeSection, onAnchor, onOpenGrades, courseId = featuredCourseId }: {
  courseId?: string; onOpenGrades: () => void; onDialog: (dialog: CourseDialog) => void; onProgram: () => void; programOpen: boolean; toc?: TocEntry[]; activeSection?: string; onAnchor?: (id: string) => void
}) {
  const result = calculateGrade(statementForCourse(courseId).formula!)
  const pending = assistantAssignments.find(item => item.courseId === courseId)
  const deadline = pending ? { ...pending, status: pending.status === 'new' ? 'Не начато' : pending.status === 'submitted' ? 'На проверке' : 'В процессе' } : courseAssignment
  const { formatDateTime } = useDisplayFormats()
  return <aside className="course-widgets" aria-label={toc ? 'Навигация по уроку' : 'Виджеты курса'}>
    {toc ? <Button type="button" variant="outline" className="course-program-link" id="course-program-trigger" aria-controls="course-program-panel" aria-expanded={programOpen} onClick={onProgram}>Программа курса<BookOpen aria-hidden="true" /></Button>
      : courseId === featuredCourseId ? <Button type="button" variant="outline" className="course-resource-link" onClick={() => onDialog('syllabus')}><GraduationCap aria-hidden="true" /><span><small>О курсе</small><strong>Силлабус</strong></span><ChevronRight aria-hidden="true" /></Button> : null}
    {toc ? <nav className="course-toc" aria-label="Оглавление урока"><h2><List aria-hidden="true" />На этой странице</h2><ol>{toc.map(entry => <li key={entry.id} data-depth={entry.depth ?? 0}><a href={`#${entry.id}`} aria-current={activeSection === entry.id ? 'location' : undefined} onClick={event => { event.preventDefault(); onAnchor?.(entry.id) }}>{entry.title}</a></li>)}</ol></nav>
      : <>
        <Card className="course-widget-card course-progress"><div className="course-widget-content"><h2>Прогресс по курсу</h2><p className="course-grade-total">{formatGrade(result.raw)} <span>из 10</span></p><div className="course-progress-track" role="meter" aria-label="Накоплено баллов" aria-valuemin={0} aria-valuemax={10} aria-valuenow={result.raw}><span className="course-progress-earned" style={{ width: `${Math.min(100, result.raw * 10)}%` }} /></div>
          <dl className="course-progress-legend"><div><dt><i data-tone="green" />Накоплено</dt><dd>{formatGrade(result.raw)}</dd></div><div><dt>После округления</dt><dd>{result.rounded}</dd></div></dl>
          </div><button type="button" className="course-widget-footer" onClick={onOpenGrades}>Смотреть ведомость</button></Card>
        <Card className="course-widget-card course-deadline-widget"><div className="course-widget-content"><h2>Ближайший дедлайн<CalendarClock aria-hidden="true" /></h2>
          <button type="button" className="course-deadline-summary" onClick={() => onDialog('assignment')}><span>{deadline.title}</span><time dateTime={deadline.dueAt}>{formatDateTime(deadline.dueAt, true)} МСК</time><Badge variant="neutral">{deadline.status}</Badge></button>
          </div><button type="button" className="course-widget-footer" onClick={() => onDialog('assignment')}>Открыть задание</button></Card>
      </>}
    {courseId === featuredCourseId ? <Button type="button" variant="outline" className="course-resource-link" onClick={() => onDialog('chat')}><MessageCircle aria-hidden="true" /><span><small>Общение</small><strong>Чат курса</strong></span><ChevronRight aria-hidden="true" /></Button> : null}
    {!toc && courseId === featuredCourseId ? <Button type="button" variant="outline" className="course-resource-link" onClick={() => onDialog('help')}><CircleHelp aria-hidden="true" /><span><small>Написать в Маяк</small><strong>Помощь в учёбе</strong></span><ChevronRight aria-hidden="true" /></Button> : null}
  </aside>
}
