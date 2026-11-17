import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { curriculumBlocks, courseLessons, type CourseBlock, type CourseLesson, type CourseEntity } from '@/data/courses'
import CourseProgram from './CourseProgram'

export default function CourseProgramPanel({ open, courseTitle, activeLessonId, onSelect, onClose, blocks = curriculumBlocks, lessons = courseLessons }: {
  open: boolean; blocks?: CourseBlock[]; lessons?: CourseLesson[]; courseTitle: string; activeLessonId: string; onSelect: (entity: CourseEntity, blockId: string) => void; onClose: () => void
}) {
  const [openBlocks, setOpenBlocks] = useState(() => blocks.map(block => block.id))
  useEffect(() => {
    const blockId = lessons.find(lesson => lesson.id === activeLessonId)?.blockId
    if (blockId) setOpenBlocks(current => current.includes(blockId) ? current : [...current, blockId])
  }, [activeLessonId, lessons])
  return <Sheet open={open} onOpenChange={next => { if (!next) onClose() }}>
    <SheetContent side="right" width="wide" id="course-program-panel" className="course-program-panel" onCloseAutoFocus={event => {
      event.preventDefault()
      const desktopTrigger = document.getElementById('course-program-trigger')
      const trigger = desktopTrigger?.offsetParent ? desktopTrigger : document.getElementById('course-mobile-program-trigger')
      trigger?.focus({ preventScroll: true })
    }}>
      <SheetHeader className="course-program-header">
        <SheetTitle>Программа курса</SheetTitle>
        <SheetDescription>{courseTitle}</SheetDescription>
        <p className="text-xs text-muted-foreground">Блоков: {blocks.length} · Тем: {lessons.length}</p>
      </SheetHeader>
      <nav className="course-program-content" aria-label="Структура курса">
        <CourseProgram blocks={blocks} idPrefix="panel-course" openBlocks={openBlocks} activeLessonId={activeLessonId} onToggle={id => setOpenBlocks(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])} onSelect={(entity, blockId) => { onClose(); onSelect(entity, blockId) }} />
      </nav>
    </SheetContent>
  </Sheet>
}
