import { ArrowLeft, ArrowRight, BookOpen, Clock3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { lectureText } from '@/data/lecture-content'
import type { CourseLesson } from '@/data/courses'
import CourseResources from './CourseResources'
import { MobileLessonToc } from './CourseLongread'
export default function CourseLessonReader({ courseId, lesson, lessons, activeSection, onAnchor, onLesson, onProgram, onAssignment }: {
  courseId: string; lesson: CourseLesson; lessons: CourseLesson[]; activeSection: string; onAnchor: (id: string) => void; onLesson: (id: string) => void; onProgram: () => void; onAssignment: () => void
}) {
  const index = lessons.findIndex(item => item.id === lesson.id)
  const text = lectureText(courseId, index)
  return <>
    <div className="course-lesson-meta"><Badge variant="active">{lesson.format}</Badge><span><Clock3 aria-hidden="true" />{lesson.readingMinutes} минут чтения</span></div>
    <Button variant="outline" type="button" id="course-mobile-program-trigger" className="course-mobile-program-trigger" onClick={onProgram} aria-controls="course-program-panel" aria-expanded={false}><BookOpen aria-hidden="true" />Программа курса</Button>
    <MobileLessonToc active={activeSection} onAnchor={onAnchor} />
    <article className="course-reader course-island"><div className="course-reader-body">
      <section><h2 id="lesson-overview" tabIndex={-1}>Содержание занятия</h2><p>{text.explanation}</p><h3 id="lesson-loss" tabIndex={-1}>Разбор примера</h3><p>{text.example}</p></section>
      <section><h2 id="lesson-practice" tabIndex={-1}>Практика</h2><p>{text.exercise}</p><ol><li>Запишите исходные данные и требуемый результат.</li><li>Обоснуйте каждый шаг решения.</li><li>Проверьте ответ и сформулируйте вывод.</li></ol></section>
      <section><h2 id="lesson-materials" tabIndex={-1}>Дополнительные материалы</h2><CourseResources courseId={courseId} /></section>
      <section><h2 id="lesson-video" tabIndex={-1}>Видеозапись</h2><p>Видеозапись этого занятия пока не опубликована.</p></section>
      <section><h2 id="lesson-assignment" tabIndex={-1}>Задание</h2><p>Закрепите тему в задании курса. Условия, срок и результат связаны с ведомостью.</p><Button type="button" variant="outline" onClick={onAssignment}>Открыть задание</Button></section>
      <section><h2 id="lesson-summary" tabIndex={-1}>Итог</h2><p>После занятия проверьте, можете ли вы объяснить разобранный пример, воспроизвести решение и указать ограничения использованного подхода.</p><p>{text.exercise}</p></section>
    </div></article>
    <nav className="course-lesson-navigation" aria-label="Навигация между уроками"><Button type="button" variant="ghost" disabled={index === 0} onClick={() => onLesson(lessons[index - 1].id)}><ArrowLeft aria-hidden="true" />Предыдущий урок</Button><Button type="button" variant="ghost" disabled={index === lessons.length - 1} onClick={() => onLesson(lessons[index + 1].id)}>Следующий урок<ArrowRight aria-hidden="true" /></Button></nav>
  </>
}
