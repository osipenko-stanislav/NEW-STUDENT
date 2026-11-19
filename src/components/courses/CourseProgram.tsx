import { DeadlineTransfer } from '@/components/late-days/TaskDeadline'
import { academicTasks } from '@/data/academic-data'
import HomeworkModeBadge from './HomeworkModeBadge'
import { BookOpen, Check, ChevronDown, ChevronRight, FileText, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SemanticIcon } from '@/components/ui/semantic-icon'
import { curriculumBlocks, type CourseBlock, type CourseEntity } from '@/data/courses'

export default function CourseProgram({ openBlocks, onToggle, onSelect, activeLessonId, idPrefix = 'course', blocks = curriculumBlocks, courseId }: {
  blocks?: CourseBlock[]; openBlocks: string[]; onToggle: (id: string) => void; onSelect: (entity: CourseEntity, blockId: string) => void; activeLessonId?: string | null; idPrefix?: string; courseId?: string
}) {
  return <>{blocks.map((block, index) => <details key={block.id} id={`${idPrefix}-${block.id}`} open={openBlocks.includes(block.id)} className="course-block">
                <summary aria-expanded={openBlocks.includes(block.id)} onClick={event => { event.preventDefault(); onToggle(block.id) }}><SemanticIcon icon={BookOpen} tone="blue" size="compact" /><span className="course-block-title"><span className="course-block-number">Блок {index + 1} — </span><span>{block.title}</span></span><ChevronDown className="course-chevron" aria-hidden="true" /></summary>
                <ul className="course-entity-list">{block.entities.map(entity => <li key={entity.id} className={entity.kind === 'assignment' ? 'course-entity-with-actions' : undefined}><a href={`?section=Курсы&course=${encodeURIComponent(courseId ?? '')}${entity.lessonId ? `&lesson=${encodeURIComponent(entity.lessonId)}` : entity.kind === 'assignment' ? `&task=${encodeURIComponent(entity.id)}&tab=homework` : ''}`} aria-current={activeLessonId && entity.lessonId === activeLessonId ? 'page' : undefined} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); onSelect(entity, block.id) }}>
                  <SemanticIcon icon={entity.kind === 'assignment' || entity.kind === 'material' ? FileText : entity.kind === 'seminar' ? Video : BookOpen} tone={entity.kind === 'assignment' ? 'violet' : 'blue'} size="compact" /><span>{entity.title}</span>{entity.kind === 'assignment' ? <HomeworkModeBadge minutes={academicTasks.find(task => task.id === entity.id)?.timeLimitMinutes} /> : null}
                  {entity.status === 'completed' ? <span className="course-entity-status"><Check aria-hidden="true" /><span className="sr-only">Завершено</span></span> : entity.status === 'active' ? <Badge variant="active">В работе</Badge> : <ChevronRight className="course-entity-arrow" aria-hidden="true" />}
                </a>{entity.kind === 'assignment' ? <DeadlineTransfer taskId={entity.id} /> : null}</li>)}</ul>
              </details>)}</>
}
