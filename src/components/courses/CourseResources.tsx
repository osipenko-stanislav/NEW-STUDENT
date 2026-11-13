import AcademicMaterialLink from '@/components/AcademicMaterialLink'
import { ArrowDownToLine, MessageSquarePlus, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import FileIcon from '@/components/FileIcon'
import { materialsForCourse } from '@/data/academic-data'
import { useAcademicMaterialActions } from '@/components/AcademicMaterialActions'
import { useMaterialSync } from '@/components/MaterialSyncProvider'
export default function CourseResources({ courseId }: { courseId: string }) {
  const materials = materialsForCourse(courseId)
  const actions = useAcademicMaterialActions()
  const { exportMaterial } = useMaterialSync()
  return <section className="course-section" aria-label="Материалы курса"><ul className="course-lesson-materials">{materials.map(material => <li key={material.id}><AcademicMaterialLink material={material}  aria-label={`Открыть материал: ${material.title}`}><FileIcon name={`${material.title}.${material.fileType.toLowerCase()}`} size="compact" /><span><strong>{material.title}</strong><small>{material.fileType}</small></span></AcademicMaterialLink><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={`Действия с материалом: ${material.title}`}><MoreHorizontal aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
    <DropdownMenuItem onSelect={() => void exportMaterial(material.id)}><ArrowDownToLine aria-hidden="true" />Экспортировать</DropdownMenuItem>
    {actions ? <DropdownMenuItem disabled={actions.pendingId !== null} onSelect={() => void actions.addToChat(material.id)}><MessageSquarePlus aria-hidden="true" />{actions.pendingId === material.id ? 'Добавляем…' : 'Добавить в чат'}</DropdownMenuItem> : null}
  </DropdownMenuContent></DropdownMenu></li>)}</ul>{actions?.error ? <p className="text-sm text-destructive mt-3" role="alert">{actions.error}</p> : null}</section>
}
