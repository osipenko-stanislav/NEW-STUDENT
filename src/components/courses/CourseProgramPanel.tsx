import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { curriculumBlocks, courseLessons, type CourseBlock, type CourseLesson, type CourseEntity } from '@/data/courses'
import CourseProgram from './CourseProgram'

export default function CourseProgramPanel({ courseTitle, activeLessonId, onSelect, onClose, blocks = curriculumBlocks, lessons = courseLessons }: {
  blocks?: CourseBlock[]; lessons?: CourseLesson[]; courseTitle: string; activeLessonId: string; onSelect: (entity: CourseEntity, blockId: string) => void; onClose: () => void
}) {
  const [openBlocks, setOpenBlocks] = useState(() => blocks.map(block => block.id))
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { headingRef.current?.focus() }, [])
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !document.querySelector('[role="dialog"]')) {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])
  useEffect(() => {
    const blockId = lessons.find(lesson => lesson.id === activeLessonId)?.blockId
    if (blockId) setOpenBlocks(current => current.includes(blockId) ? current : [...current, blockId])
  }, [activeLessonId, lessons])
  return <Sidebar side="right" collapsible="none" role="complementary" id="course-program-panel"
    aria-labelledby="course-program-title" className="course-program-panel">
    <SidebarHeader className="flex-row items-start justify-between gap-3 border-b p-4">
      <div className="min-w-0"><h2 id="course-program-title" ref={headingRef} tabIndex={-1} className="text-base font-semibold outline-none">Программа курса</h2>
        <p className="mt-1 text-xs text-muted-foreground">{courseTitle}</p>
        <p className="mt-2 text-xs text-muted-foreground">Блоков: {blocks.length} · Тем: {lessons.length}</p>
      </div>
      <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Закрыть программу курса" onClick={onClose}><X aria-hidden="true" /></Button>
    </SidebarHeader>
    <SidebarContent className="gap-0 p-3"><nav aria-label="Структура курса">
      <CourseProgram blocks={blocks} idPrefix="panel-course" openBlocks={openBlocks} activeLessonId={activeLessonId} onToggle={id => setOpenBlocks(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])} onSelect={onSelect} />
    </nav></SidebarContent>
  </Sidebar>
}
