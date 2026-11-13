import { ArrowDownToLine, MessageSquarePlus } from 'lucide-react'
import { academicMaterials } from '@/data/academic-data'
import FilePreview from '@/components/FilePreview'
import { useMaterialLibrary } from '@/components/MaterialLibraryProvider'
import { useSyncExternalStore } from 'react'
import { useAcademicMaterialActions } from '@/components/AcademicMaterialActions'
import { useMaterialSync } from '@/components/MaterialSyncProvider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

export default function AcademicMaterialDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const material = academicMaterials.find(item => item.id === id)
  const actions = useAcademicMaterialActions()
  const { exportMaterial } = useMaterialSync()
  const library = useMaterialLibrary()
  const { materials } = useSyncExternalStore(library.subscribe, library.getSnapshot)
  const local = materials.find(item => item.sourceAcademicId === id)
  if (!material) return null
  const name = material.title.toLowerCase().endsWith(`.${material.fileType.toLowerCase()}`) ? material.title : `${material.title}.${material.fileType.toLowerCase()}`
  return <Dialog open onOpenChange={open => { if (!open) onClose() }}><DialogContent className="material-file-dialog">
    <DialogHeader><DialogTitle>{material.title}</DialogTitle><DialogDescription>{material.course} · {material.fileType} · {local ? 'Доступен на устройстве' : 'Еще не сохранен'}</DialogDescription></DialogHeader>
    <div className="material-file-tab-panel"><FilePreview key={`${local?.id}:${local?.academicRevision}`} material={{ id: local?.id ?? material.id, name, type: local?.type ?? '' }} library={library} /></div>
    {actions?.error ? <p role="alert" className="text-sm text-destructive">{actions.error}</p> : null}
    <DialogFooter className="flex-wrap gap-2 sm:space-x-0"><Button variant="outline" onClick={() => void exportMaterial(material.id)}><ArrowDownToLine aria-hidden="true" />Экспортировать</Button>
      {actions ? <Button variant="outline" disabled={actions.pendingId !== null} onClick={() => void actions.addToChat(material.id)}><MessageSquarePlus aria-hidden="true" />{actions.pendingId === material.id ? 'Добавляем…' : 'В чат'}</Button> : null}
    </DialogFooter>
  </DialogContent></Dialog>
}
