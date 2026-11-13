import { useActionFeedback } from '@/components/ui/feedback-button'
import { StateIcon } from '@/components/ui/state-icon'
import AcademicMaterialLink from '@/components/AcademicMaterialLink'
import { ArrowDownToLine, MessageSquarePlus, MoreHorizontal, Check, LoaderCircle, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import FileIcon from '@/components/FileIcon'
import { materialsForCourse, type AcademicMaterial } from '@/data/academic-data'
import { useAcademicMaterialActions } from '@/components/AcademicMaterialActions'
import { useMaterialSync } from '@/components/MaterialSyncProvider'
export default function CourseResources({ courseId }: { courseId: string }) {
  const materials = materialsForCourse(courseId)
  return <section className="course-section" aria-label="Материалы курса"><ul className="course-lesson-materials">{materials.map(material => <ResourceItem key={material.id} material={material} />)}</ul><ResourceError /></section>
}
function ResourceError() {
  const actions = useAcademicMaterialActions()
  return actions?.error ? <p className="text-sm text-destructive mt-3" role="alert">{actions.error}</p> : null
}
function ResourceItem({ material }: { material: AcademicMaterial }) {
  const actions = useAcademicMaterialActions()
  const { state, run } = useActionFeedback()
  const { exportMaterial } = useMaterialSync()
  return <li><AcademicMaterialLink material={material}  aria-label={`Открыть материал: ${material.title}`}><FileIcon name={`${material.title}.${material.fileType.toLowerCase()}`} size="compact" /><span><strong>{material.title}</strong><small>{material.fileType}</small></span></AcademicMaterialLink><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={`Действия с материалом: ${material.title}`}><StateIcon state={state}>{state === "loading" ? <LoaderCircle className="action-spinner" /> : state === "success" ? <Check /> : state === "error" ? <TriangleAlert /> : <MoreHorizontal />}</StateIcon><span className="sr-only" role="status">{state === "success" ? "Файл экспортирован" : state === "error" ? "Не удалось экспортировать файл" : state === "loading" ? "Экспортируем файл" : ""}</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
    <DropdownMenuItem onSelect={() => void run(() => exportMaterial(material.id))}><ArrowDownToLine aria-hidden="true" />Экспортировать</DropdownMenuItem>
    {actions ? <DropdownMenuItem disabled={actions.pendingId !== null} onSelect={() => void actions.addToChat(material.id)}><MessageSquarePlus aria-hidden="true" />{actions.pendingId === material.id ? 'Добавляем…' : 'Добавить в чат'}</DropdownMenuItem> : null}
  </DropdownMenuContent></DropdownMenu></li>
}
