import { academicTasks } from '@/data/academic-data'
import HomeworkModeBadge from './HomeworkModeBadge'
import { BookOpen, Check, ChevronDown, ChevronRight, FileText, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SemanticIcon } from '@/components/ui/semantic-icon'
import { curriculumBlocks, type CourseBlock, type CourseEntity } from '@/data/courses'

export default function CourseProgram({ openBlocks, onToggle, onSelect, activeLessonId, idPrefix = 'course', blocks = curriculumBlocks }: {
  blocks?: CourseBlock[]; openBlocks: string[]; onToggle: (id: string) => void; onSelect: (entity: CourseEntity, blockId: string) => void; activeLessonId?: string | null; idPrefix?: string
}) {
  return <>{blocks.map((block, index) => <details key={block.id} id={`${idPrefix}-${block.id}`} open={openBlocks.includes(block.id)} className="course-block">
                <summary aria-expanded={openBlocks.includes(block.id)} onClick={event => { event.preventDefault(); onToggle(block.id) }}><SemanticIcon icon={BookOpen} tone="blue" size="compact" /><span>Блок {index + 1} — {block.title}</span><ChevronDown className="course-chevron" aria-hidden="true" /></summary>
                <ul className="course-entity-list">{block.entities.map(entity => <li key={entity.id}><button type="button" aria-current={activeLessonId && entity.lessonId === activeLessonId ? 'page' : undefined} onClick={() => onSelect(entity, block.id)}>
                  <SemanticIcon icon={entity.kind === 'assignment' || entity.kind === 'material' ? FileText : entity.kind === 'seminar' ? Video : BookOpen} tone={entity.kind === 'assignment' ? 'violet' : 'blue'} size="compact" /><span>{entity.title}</span>{entity.kind === 'assignment' ? <HomeworkModeBadge minutes={academicTasks.find(task => task.id === entity.id)?.timeLimitMinutes} /> : null}
                  {entity.status === 'completed' ? <span className="course-entity-status"><Check aria-hidden="true" /><span className="sr-only">Завершено</span></span> : entity.status === 'active' ? <Badge variant="active">В работе</Badge> : <ChevronRight className="course-entity-arrow" aria-hidden="true" />}
                </button></li>)}</ul>
              </details>)}</>
}
