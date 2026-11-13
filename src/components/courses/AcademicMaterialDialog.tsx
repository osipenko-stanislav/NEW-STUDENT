import { ArrowDownToLine, ExternalLink, MessageSquarePlus } from 'lucide-react'
import { academicMaterials } from '@/data/academic-data'
import FilePreview from '@/components/FilePreview'
import { useAcademicMaterialActions } from '@/components/AcademicMaterialActions'
import { useDownloadDemo } from '@/components/DownloadDemoProvider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

export default function AcademicMaterialDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const material = academicMaterials.find(item => item.id === id)
  const actions = useAcademicMaterialActions()
  const { start } = useDownloadDemo()
  if (!material) return null
  const url = `${import.meta.env.BASE_URL}${material.url}`
  const name = material.title.toLowerCase().endsWith(`.${material.fileType.toLowerCase()}`) ? material.title : `${material.title}.${material.fileType.toLowerCase()}`
  return <Dialog open onOpenChange={open => { if (!open) onClose() }}><DialogContent className="material-file-dialog">
    <DialogHeader><DialogTitle>{material.title}</DialogTitle><DialogDescription>{material.course} · {material.fileType}</DialogDescription></DialogHeader>
    <div className="material-file-tab-panel"><FilePreview key={material.id} material={{ id: material.id, name, type: material.fileType === 'IPYNB' ? 'application/json' : '' }} sourceUrl={url} /></div>
    {actions?.error ? <p role="alert" className="text-sm text-destructive">{actions.error}</p> : null}
    <DialogFooter className="flex-wrap gap-2 sm:space-x-0"><Button variant="ghost" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" />Открыть файл</a></Button>
      <Button variant="outline" onClick={() => start('file', material.title)}><ArrowDownToLine aria-hidden="true" />Скачать</Button>
      {actions ? <Button variant="outline" disabled={actions.pendingId !== null} onClick={() => void actions.addToChat(material.id)}><MessageSquarePlus aria-hidden="true" />{actions.pendingId === material.id ? 'Добавляем…' : 'В чат'}</Button> : null}
    </DialogFooter>
  </DialogContent></Dialog>
}
