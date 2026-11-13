import { DownloadPackButton } from '@/components/DownloadDemoProvider'
import { useRef, useState, type DragEvent } from 'react'
import { ArrowDown, ArrowUp, ChevronsUp, GripVertical, MoreHorizontal, Code2, Calculator, GraduationCap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { areaLabels, courses, courseFilters, levelLabels, type Course, type CourseFilter } from '@/data/courses'
import { loadCourseOrder, moveCourse, saveCourseOrder } from '@/lib/course-order'
const ids = courses.map(course => course.id)

export function CourseLevels({ course }: { course: Course }) {
  return course.levels.length ? <TooltipProvider delayDuration={200}><span className="course-levels" aria-label={`Уровни: ${course.levels.map(level => levelLabels[level]).join(', ')}`}>
    {course.levels.map(level => <Tooltip key={level}><TooltipTrigger asChild><span tabIndex={0} className="course-level-target" aria-label={`${levelLabels[level]} уровень`}>
      <span aria-hidden="true" className="course-level-star" data-level={level} style={{ maskImage: `url(${import.meta.env.BASE_URL}assets/courses/${`level-${level}.svg`})` }} />
    </span></TooltipTrigger><TooltipContent>{levelLabels[level]} уровень</TooltipContent></Tooltip>)}
  </span></TooltipProvider> : null
}

export default function CourseCatalog({ onOpen }: { onOpen: (id: string) => void }) {
  const [snapshot, setSnapshot] = useState(() => loadCourseOrder(ids))
  const [filter, setFilter] = useState<CourseFilter>('all')
  const [dragged, setDragged] = useState<string | null>(null)
  const [drop, setDrop] = useState<{ id: string; after: boolean } | null>(null)
  const [notice, setNotice] = useState('')
  const suppressClick = useRef(false)
  const ordered = snapshot.order.map(id => courses.find(course => course.id === id)!).filter(Boolean)
  const visible = ordered.filter(course => filter === 'all' || course.category === filter)

  function commit(order: string[], id: string) {
    try { saveCourseOrder(order) }
    catch { setSnapshot(previous => ({ ...previous, error: 'Не удалось сохранить порядок. Проверь доступ к хранилищу браузера.' })); return }
    setSnapshot({ order, error: null })
    const title = courses.find(course => course.id === id)!.title
    setNotice(`${title}: позиция ${order.indexOf(id) + 1} из ${order.length}. Порядок сохранён.`)
  }
  function move(id: string, direction: 'up' | 'down' | 'first') {
    const index = visible.findIndex(course => course.id === id)
    const target = direction === 'first' ? visible[0] : visible[index + (direction === 'up' ? -1 : 1)]
    if (target) commit(moveCourse(snapshot.order, id, target.id, direction === 'down'), id)
  }
  function finishDrag() { setDragged(null); setDrop(null); window.setTimeout(() => { suppressClick.current = false }, 0) }
  function dragOver(event: DragEvent<HTMLElement>, id: string) {
    if (!dragged || dragged === id) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const bounds = event.currentTarget.getBoundingClientRect()
    setDrop({ id, after: event.clientX > bounds.x + bounds.width / 2 })
  }
  return <section className="page-container course-catalog" aria-labelledby="course-catalog-title">
    <header className="course-catalog-header"><div className="course-catalog-heading"><div><h1 id="course-catalog-title" tabIndex={-1} data-course-route-heading>Мои курсы</h1></div><div className="course-catalog-actions"><DownloadPackButton /></div></div>
      <div className="course-filter-list" role="group" aria-label="Категории курсов">{courseFilters.map(item => <Button key={item.id} type="button" variant={filter === item.id ? 'default' : 'outline'}
        aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</Button>)}</div>
    </header>
    <div className="sr-only"><p id="course-order-help">Перетащи карточку или измени порядок через меню.</p></div>
    <div className="course-grid" aria-describedby="course-order-help">
      {visible.map((course, index) => <Card role="article" key={course.id} className={`course-tile ${dragged === course.id ? 'is-dragging' : ''}`}
        data-course-id={course.id} data-drop={drop?.id === course.id ? drop.after ? 'after' : 'before' : undefined} draggable
        onDragStart={event => { if ((event.target as HTMLElement).closest('.course-tile-menu')) { event.preventDefault(); return } suppressClick.current = true; setDragged(course.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', course.id) }}
        onDragOver={event => dragOver(event, course.id)} onDragEnd={finishDrag}
        onDrop={event => { event.preventDefault(); if (dragged && drop?.id === course.id) commit(moveCourse(snapshot.order, dragged, course.id, drop.after), dragged); finishDrag() }}>
        <button type="button" className="course-tile-open" onClick={() => { if (!suppressClick.current) onOpen(course.id) }} aria-label={`Открыть курс: ${course.title}`}>
          <span className="course-tile-area"><span className="course-area-icon">{course.area === 'development' ? <Code2 aria-hidden="true" /> : course.area === 'math' ? <Calculator aria-hidden="true" /> : <GraduationCap aria-hidden="true" />}</span>{areaLabels[course.area]}</span>
          <span className="course-tile-title">{course.title}</span>
        </button>
        <div className="course-tile-top-actions"><CourseLevels course={course} /><DropdownMenu><DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="course-tile-menu" aria-label={`Порядок курса: ${course.title}`}><MoreHorizontal aria-hidden="true" /></Button>
        </DropdownMenuTrigger><DropdownMenuContent align="end" collisionPadding={12}>
          <DropdownMenuItem disabled={index === 0} onSelect={() => move(course.id, 'first')}><ChevronsUp aria-hidden="true" />В начало списка</DropdownMenuItem>
          <DropdownMenuItem disabled={index === 0} onSelect={() => move(course.id, 'up')}><ArrowUp aria-hidden="true" />Переместить выше</DropdownMenuItem>
          <DropdownMenuItem disabled={index === visible.length - 1} onSelect={() => move(course.id, 'down')}><ArrowDown aria-hidden="true" />Переместить ниже</DropdownMenuItem>
        </DropdownMenuContent></DropdownMenu></div>
        <GripVertical className="course-tile-grip" aria-hidden="true" />
      </Card>)}
    </div>
    {snapshot.error ? <p className="course-storage-error" role="alert">{snapshot.error}</p> : null}
    <p className="sr-only" role="status">{notice}</p>
  </section>
}
