import CourseHomework from './CourseHomework'
import AcademicMaterialDialog from './AcademicMaterialDialog'
import { navigate, useNavigation } from '@/hooks/use-navigation'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { areaLabels, courseFilters, featuredCourseId, courses, handbookUrl, type CourseRecording, type CourseEntity } from '@/data/courses'
import CourseResources from './CourseResources'
import CourseHomeworks from './CourseHomeworks'
import CourseGradeSummary from './CourseGradeSummary'
import CourseLessonReader from './CourseLessonReader'
import { blocksForCourse, lessonsForCourse } from '@/data/course-curricula'
import { academicTasks, tasksForCourse, enrollments } from '@/data/academic-data'

import CourseProgram from './CourseProgram'
import CourseProgramPanel from './CourseProgramPanel'
import CourseCatalog, { CourseLevels } from './CourseCatalog'
import CourseDialogs, { RecordingPreview, type CourseDialog } from './CourseDialogs'
import CourseWidgets from './CourseWidgets'
import CourseRecordings from './CourseRecordings'
import CourseLongread, { lessonToc, useActiveLessonSection } from './CourseLongread'

export default function CoursesWorkspace({ onAskNavigator, onOpenGrades }: { onAskNavigator: (query: string) => void; onOpenGrades: (courseId: string, enrollmentId?: string) => void }) {
  const { materialId, courseId, courseEnrollmentId, lessonId, taskId, originBlockId, courseTab: tab } = useNavigation()
  const setTab = (courseTab: string) => navigate({ courseTab }, true)
  const setTaskId = (taskId: string | null) => navigate({ taskId })
  const [openBlocks, setOpenBlocks] = useState<string[]>([])
  const [programOpen, setProgramOpen] = useState(false)
  const [dialog, setDialog] = useState<CourseDialog>(null)
  const [recording, setRecording] = useState<CourseRecording | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const routeKey = `${courseId || ''}/${lessonId || ''}/${taskId || ''}`
  const [activeSection, onAnchor] = useActiveLessonSection(scrollRef, routeKey)
  const course = courses.find(item => item.id === courseId)
  const lessons = useMemo(() => courseId ? lessonsForCourse(courseId) : [], [courseId])
  const blocks = useMemo(() => courseId ? blocksForCourse(courseId) : [], [courseId])
  const lesson = lessons.find(item => item.id === lessonId)
  const originBlock = blocks.find(block => block.id === originBlockId)
  const selectedTask = academicTasks.find(task => task.id === taskId)
  const enrollment = enrollments.find(item => item.courseId === courseId && item.id === (selectedTask?.enrollmentId ?? courseEnrollmentId ?? `current-${courseId}`))
  useLayoutEffect(() => {
    if (selectedTask?.courseId === courseId && selectedTask && courseEnrollmentId !== selectedTask.enrollmentId) navigate({ courseEnrollmentId: selectedTask.enrollmentId }, true)
  }, [selectedTask, courseId, courseEnrollmentId])
  useLayoutEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0 }, [routeKey])
  useLayoutEffect(() => { scrollRef.current?.querySelector<HTMLElement>('[data-course-route-heading]')?.focus({ preventScroll: true }) }, [courseId, lessonId])
  function openCourse(id: string, enrollmentId?: string) { setProgramOpen(false); navigate({ courseId: id, courseEnrollmentId: enrollmentId ?? null, lessonId: null, taskId: null, courseTab: enrollmentId ? 'homework' : 'course' }); setOpenBlocks([]) }
  function catalog() { setProgramOpen(false); navigate({ courseId: null, lessonId: null }) }
  function program() { setProgramOpen(false); navigate({ lessonId: null, courseTab: 'course' }) }
  function openBlock(id: string) {
    program(); setOpenBlocks(current => [...new Set([...current, id])]); setDialog(null)
    requestAnimationFrame(() => document.getElementById(`course-${id}`)?.scrollIntoView({ block: 'start' }))
  }
  function recordings() { setProgramOpen(false); navigate({ lessonId: null, courseTab: 'recordings' }); setRecording(null) }
  function openLesson(id: string, blockId?: string) { navigate({ originBlockId: blockId ?? lessons.find(item => item.id === id)!.blockId, lessonId: id }) }
  function selectEntity(entity: CourseEntity, blockId: string) {
    if (entity.lessonId) {
      openLesson(entity.lessonId, blockId)
    } else if (entity.materialId) {
      navigate({ materialId: entity.materialId }, true)
    } else setTaskId(entity.id)
  }
  if (selectedTask && selectedTask.courseId === courseId) return <div className="course-workspace"><div ref={scrollRef} className="course-surface"><CourseHomework key={selectedTask.id} task={selectedTask} /><AcademicMaterialDialog id={materialId} onClose={() => navigate({ materialId: null }, true)} /></div></div>
  if (course && enrollment?.archived) return <div className="course-workspace"><div ref={scrollRef} className="course-surface"><section className="page-container course-archive-page" data-layout="workspace">
    <header className="course-heading-island"><nav className="course-breadcrumbs" aria-label="Хлебные крошки курса"><button type="button" onClick={catalog}>Мои курсы</button></nav>
      <h1 data-typography="accent-title" tabIndex={-1} data-course-route-heading className="text-3xl">{course.title}</h1><p className="course-heading-subtitle">{enrollment.semester} семестр · Архивный курс</p>
    </header>
    <Tabs value={tab === 'grades' ? 'grades' : 'homework'} onValueChange={setTab}><TabsList aria-label="Разделы архивного курса"><TabsTrigger value="homework">Домашки</TabsTrigger><TabsTrigger value="grades">Ведомость по курсу</TabsTrigger></TabsList>
      <TabsContent value="homework"><CourseHomeworks courseId={course.id} enrollmentId={enrollment.id} onOpen={setTaskId} /></TabsContent>
      <TabsContent value="grades"><CourseGradeSummary courseId={course.id} enrollmentId={enrollment.id} onOpen={() => onOpenGrades(course.id, enrollment.id)} /></TabsContent>
    </Tabs>
  </section></div></div>
  return <div className="course-workspace"><div ref={scrollRef} className="course-surface" aria-label="Учебная область">
    {!course ? <CourseCatalog onOpen={openCourse} /> : <div key={routeKey} data-layout={lesson ? "reading" : "workspace"} data-with-rail className={`page-container course-page course-layout motion-route-enter ${lesson ? 'course-lesson-layout' : ''}`}>
      <Tabs value={tab} onValueChange={setTab} className="course-main-column">
        <header className="course-heading-island"><nav className="course-breadcrumbs" aria-label="Хлебные крошки курса"><button type="button" onClick={catalog}>Мои курсы</button>{lesson ? <ChevronRight aria-hidden="true" /> : null}
          {lesson ? <><button type="button" onClick={program}>{course.title}</button><ChevronRight aria-hidden="true" /><button type="button" onClick={() => openBlock(originBlockId)}>Блок {blocks.findIndex(block => block.id === originBlockId) + 1}</button></> : null}</nav>
          <div className="course-title-row"><h1 data-typography="accent-title" tabIndex={-1} data-course-route-heading>{lesson ? lesson.title : course.title}</h1>{!lesson ? <CourseLevels course={course} /> : null}</div>
          {lesson ? <p className="course-heading-subtitle">{originBlock?.title}</p> : <p className="course-heading-subtitle">{areaLabels[course.area]} · {courseFilters.find(item => item.id === course.category)!.label}</p>}
          {!lesson ? <TabsList aria-label="Разделы курса" className="course-tab-list"><TabsTrigger value="course">Курс</TabsTrigger><TabsTrigger value="homework">Домашки</TabsTrigger><TabsTrigger value="recordings">Видеозаписи</TabsTrigger><TabsTrigger value="materials">Материалы</TabsTrigger><TabsTrigger value="grades">Ведомость по курсу</TabsTrigger></TabsList> : null}
          {!lesson && course.id !== featuredCourseId ? <a className="course-text-link block mt-4 text-sm" href={course.syllabusUrl ?? handbookUrl} target="_blank" rel="noreferrer">{course.syllabusUrl ? 'Силлабус в Хэндбуке ↗' : 'Каталог силлабусов в Хэндбуке ↗'}</a> : null}
        </header>
        {lesson ? course.id === featuredCourseId ? <CourseLongread lesson={lesson} activeSection={activeSection} onAnchor={onAnchor} onLesson={id => openLesson(id)} onProgram={() => setProgramOpen(true)} onAssignment={() => setTaskId(tasksForCourse(course!.id).find(task => task.grade === null)?.id ?? null)}
          onVideo={() => setRecording({ id: 'lesson-video', title: lesson.title, duration: '54:00' })} />
          : <CourseLessonReader courseId={course.id} lesson={lesson} lessons={lessons} activeSection={activeSection} onAnchor={onAnchor} onLesson={id => openLesson(id)} onProgram={() => setProgramOpen(true)} onAssignment={() => {
            const task = tasksForCourse(course.id).find(task => task.topic.includes(lesson.title) && task.grade === null) ?? tasksForCourse(course.id).find(task => task.topic.includes(lesson.title))
            setTaskId(task?.id ?? null)
          }} /> : <>
            <TabsContent value="course" className="m-0"><section className="course-blocks" aria-label="Программа курса">
              <div className="course-section-heading"><h2>Программа курса</h2></div>
              <CourseProgram blocks={blocks} openBlocks={openBlocks} onToggle={id => setOpenBlocks(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])} onSelect={selectEntity} />
            </section></TabsContent><TabsContent value="recordings" className="m-0">{course.id === featuredCourseId ? <CourseRecordings onOpen={setRecording} /> : <section className="course-section"><h2 className="text-base font-semibold">Видеозаписи</h2><p className="mt-2 text-sm text-muted-foreground">Записи занятий пока не опубликованы.</p></section>}</TabsContent>
          </>}

        {!lesson ? <><TabsContent value="homework" className="m-0"><CourseHomeworks courseId={course.id} onOpen={setTaskId} /></TabsContent><TabsContent value="materials" className="m-0"><CourseResources courseId={course.id} /></TabsContent><TabsContent value="grades" className="m-0"><CourseGradeSummary courseId={course.id} onOpen={() => onOpenGrades(course.id)} /></TabsContent></> : null}
      </Tabs>
      <CourseWidgets courseId={course.id} onOpenGrades={() => onOpenGrades(course.id)} onDialog={value => { if (value === 'assignment') setTaskId(tasksForCourse(course.id).find(task => task.grade === null)?.id ?? null); else setDialog(value) }} onProgram={() => setProgramOpen(true)} programOpen={programOpen} toc={lesson ? lessonToc : undefined} activeSection={activeSection} onAnchor={onAnchor} />
    </div>}
    </div>
    {lesson && course ? <CourseProgramPanel open={programOpen} blocks={blocks} lessons={lessons} courseTitle={course.title} activeLessonId={lesson.id} onSelect={selectEntity} onClose={() => setProgramOpen(false)} /> : null}
    <AcademicMaterialDialog id={materialId} onClose={() => navigate({ materialId: null }, true)} />
    <CourseDialogs dialog={dialog} onClose={() => setDialog(null)} onOpenBlock={openBlock} onAskNavigator={onAskNavigator} />
    <RecordingPreview recording={recording} onClose={() => setRecording(null)} onRecordings={lesson ? recordings : undefined} />
  </div>
}
