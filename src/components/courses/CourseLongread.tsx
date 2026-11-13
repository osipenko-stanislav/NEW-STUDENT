import { useDownloadDemo } from '@/components/DownloadDemoProvider'
import { useEffect, useState, type RefObject } from 'react'
import { ArrowDownToLine, ArrowLeft, ArrowRight, BookOpen, ChevronDown, Clock3, List, Play, VideoOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import FileIcon from '@/components/FileIcon'
import CourseDiagram from './CourseDiagram'
import { courseAssignment, courseLessons, learningMaterials, type CourseLesson } from '@/data/courses'
import type { TocEntry } from './CourseWidgets'
export const lessonToc: TocEntry[] = [
  { id: 'lesson-overview', title: 'Содержание лекции' }, { id: 'lesson-loss', title: 'Ключевые идеи', depth: 1 },
  { id: 'lesson-practice', title: 'Практика' }, { id: 'lesson-materials', title: 'Дополнительные материалы' },
  { id: 'lesson-video', title: 'Видеозапись с лекции' }, { id: 'lesson-assignment', title: 'Задание' }, { id: 'lesson-summary', title: 'Итог' },
]
export function MobileLessonToc({ active, onAnchor }: { active: string; onAnchor: (id: string) => void }) {
  return <details className="course-mobile-toc"><summary><List aria-hidden="true" />На этой странице<ChevronDown aria-hidden="true" /></summary><nav aria-label="Оглавление урока на мобильном экране"><ol>{lessonToc.map(entry => <li key={entry.id}><a href={`#${entry.id}`} aria-current={active === entry.id ? 'location' : undefined} onClick={event => { event.preventDefault(); onAnchor(entry.id) }}>{entry.title}</a></li>)}</ol></nav></details>
}
export function useActiveLessonSection(scrollRef: RefObject<HTMLDivElement | null>, lessonId: string) {
  const [active, setActive] = useState(lessonToc[0].id)
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    let frame = 0
    const read = () => {
      frame = 0
      const top = root.getBoundingClientRect().top + 120
      const headings = lessonToc.map(entry => root.querySelector<HTMLElement>(`#${entry.id}`)).filter((node): node is HTMLElement => !!node)
      const current = headings.filter(node => node.getBoundingClientRect().top <= top).at(-1) ?? headings[0]
      if (current) setActive(current.id)
    }
    const update = () => { if (!frame) frame = requestAnimationFrame(read) }
    read(); root.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update)
    return () => { cancelAnimationFrame(frame); root.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [scrollRef, lessonId])
  return [active, (id: string) => {
    const node = scrollRef.current?.querySelector<HTMLElement>(`#${id}`)
    if (!node) return
    setActive(id)
    const motionDisabled = document.documentElement.dataset.motion === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    node.scrollIntoView({ behavior: motionDisabled ? 'instant' : 'smooth', block: 'start' })
    node.focus({ preventScroll: true })
  }] as const
}
export default function CourseLongread({ lesson, activeSection, onAnchor, onLesson, onProgram, onAssignment, onVideo }: {
  lesson: CourseLesson; activeSection: string; onAnchor: (id: string) => void; onLesson: (id: string) => void; onProgram: () => void; onAssignment: () => void; onVideo: () => void
}) {
  const { start: downloadDemo } = useDownloadDemo()
  const currentIndex = courseLessons.findIndex(item => item.id === lesson.id)
  const metrics = lesson.id === 'block-1-topic-1'
  const validation = lesson.id === 'block-1-topic-2'
  return <>
    <div className="course-lesson-meta"><Badge variant="active">{lesson.format}</Badge><span><Clock3 aria-hidden="true" />{lesson.readingMinutes} минут чтения</span></div>
    <Button type="button" variant="outline" id="course-mobile-program-trigger" className="course-mobile-program-trigger" aria-controls="course-program-panel" aria-expanded={false} onClick={onProgram}><BookOpen aria-hidden="true" />Программа курса</Button>
    <MobileLessonToc active={activeSection} onAnchor={onAnchor} />
    <article key={lesson.id} className="course-reader">
      <div className="course-reader-body">
        <section><h2 id="lesson-overview" tabIndex={-1}>Содержание занятия</h2>
          <p>{lesson.summary}</p>
          <figure className="course-network-figure"><CourseDiagram /><figcaption>Подготовка данных, построение модели и проверка результата — части одного эксперимента.</figcaption></figure>
          <h3>На что обратить внимание</h3><ul>{lesson.focus.map(item => <li key={item}>{item}</li>)}</ul>
          <h3 id="lesson-loss" tabIndex={-1}>{metrics ? 'Функция потерь' : validation ? 'Контроль качества' : 'Ключевые идеи'}</h3>
          <p>{metrics ? 'Метрика отвечает на вопрос о качестве решения, а функция потерь задаёт цель обучения. Для регрессии можно измерять величину отклонения предсказаний от ответов, для классификации — учитывать разные типы ошибок.' : validation ? 'Раздели данные до подбора параметров. Обучающую выборку используй для построения модели, валидационную — для сравнения вариантов, а тестовую оставь для независимой итоговой оценки.' : lesson.summary}</p>
          <h4>{metrics ? 'Средняя квадратичная ошибка' : validation ? 'Кросс-валидация' : lesson.focus[0]}</h4>
          {metrics ? <div className="course-equation" aria-label="MSE равно сумме квадратов разностей предсказаний и ответов, делённой на число примеров">MSE = 1/n ∑ (ŷᵢ − yᵢ)²</div> : null}
          <p>{metrics ? 'Квадратичная ошибка сильнее штрафует большие отклонения. Перед выбором метрики подумай, какие ошибки в прикладной задаче обходятся дороже.' : validation ? 'При кросс-валидации модель несколько раз обучается на разных частях данных и проверяется на оставшейся части. Так можно оценить устойчивость результата к выбору разбиения.' : 'Сформулируй гипотезу, проверь её на небольшом примере и сравни результат с простым базовым решением. Зафиксируй условия эксперимента и ограничения выбранного метода.'}</p>
        </section>
        <section><h2 id="lesson-practice" tabIndex={-1}>Практика</h2><p>Проведи небольшой воспроизводимый эксперимент. Меняй один параметр за раз, чтобы понимать причину изменений.</p>
          <ol><li>Раздели данные на обучающую и валидационную выборки.</li><li>Выбери простую модель и зафиксируй начальные параметры.</li><li>Выбери метрику качества под задачу.</li><li>Обучи модель на тренировочной выборке.</li><li>Сравни результаты на обеих выборках и запиши выводы.</li></ol>
          <blockquote>Сначала проверь решение на небольшом наборе данных. Сравнивай модели в одинаковых условиях и сохраняй не только результат, но и параметры эксперимента.</blockquote>
          <p>Примеры оценки качества доступны в <a href="https://scikit-learn.org/stable/modules/model_evaluation.html" target="_blank" rel="noreferrer">документации scikit-learn</a>.</p>
        </section>
        <section><h2 id="lesson-materials" tabIndex={-1}>Дополнительные материалы</h2><p>Конспект и короткая памятка для практики.</p>
          <ul className="course-lesson-materials">{learningMaterials.map(material => <li key={material.id}><a href={`${import.meta.env.BASE_URL}${material.url}`} target="_blank" rel="noreferrer" aria-label={`Открыть материал: ${material.title}`}><FileIcon name={material.title} size="compact" /><span><strong>{material.title}</strong><small>{material.sizeLabel}</small></span></a><Button type="button" variant="ghost" size="icon" aria-label={`Скачать материал: ${material.title}`} onClick={() => downloadDemo('file', material.title)}><ArrowDownToLine aria-hidden="true" /></Button></li>)}</ul>
        </section>
        <section><h2 id="lesson-video" tabIndex={-1}>Видеозапись с лекции</h2><div className="course-embedded-video"><div><VideoOff aria-hidden="true" /><p>Видеофайл пока не добавлен</p><Button type="button" variant="outline" onClick={onVideo}><Play aria-hidden="true" />Информация о записи</Button></div></div></section>
        <section><h2 id="lesson-assignment" tabIndex={-1}>Задание</h2><div className="course-assignment-card"><div><Badge variant="neutral">{courseAssignment.status}</Badge><h3>{courseAssignment.title}</h3><p>До {courseAssignment.points} баллов · домашнее задание</p><Button type="button" variant="outline" onClick={onAssignment}>Открыть задание</Button></div></div></section>
        <section><h2 id="lesson-summary" tabIndex={-1}>Итог</h2><p>Работа с ML-моделью — это цикл проверки гипотез. Качество зависит от данных, выбранного метода и корректной организации эксперимента.</p><p>Переходи к практике, сравни результаты и сохрани наблюдения: они помогут объяснить, почему модель работает именно так.</p></section>
      </div>
    </article>
    <nav className="course-lesson-navigation" aria-label="Навигация между уроками"><Button type="button" variant="ghost" disabled={currentIndex === 0} onClick={() => onLesson(courseLessons[currentIndex - 1].id)}><ArrowLeft aria-hidden="true" />Предыдущий урок</Button><Button type="button" variant="ghost" disabled={currentIndex === courseLessons.length - 1} onClick={() => onLesson(courseLessons[currentIndex + 1].id)}>Следующий урок<ArrowRight aria-hidden="true" /></Button></nav>
  </>
}
