import { useDisplayFormats } from '@/components/SettingsProvider'
import { useEffect, useRef, useState } from 'react'
import { Download, ExternalLink, FolderOpen, Info, MoreHorizontal, Trash2, X } from 'lucide-react'
import FileIcon from '@/components/FileIcon'
import FilePreview from '@/components/FilePreview'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatMaterialSize, materialType } from '@/lib/material-metadata'
import { resolveMaterialPreview } from '@/lib/material-preview'
import type { Conversation } from '@/types/conversation'
import type { MaterialLibrary } from '@/lib/material-library'
import type { ConversationMaterial } from '@/types/material'


type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  materials: ConversationMaterial[]
  picker: boolean
  selectedIds: string[]
  conversations: Conversation[]
  infoId: string | null
  onInfoChange: (id: string | null) => void
  onAttach: (id: string) => void
  onRemove: (id: string) => Promise<void>
  library: MaterialLibrary
  error: string | null
  busy: boolean
}

export default function MaterialsPanel({ open, onOpenChange, materials, picker, selectedIds, conversations, infoId, onInfoChange, onAttach, onRemove, library, error, busy }: Props) {
  const { formatDate, formatDateTime } = useDisplayFormats()
  const [reading, setReading] = useState(false)
  const selected = materials.find(material => material.id === infoId) ?? null
  const infoTrigger = useRef<HTMLButtonElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (open) headingRef.current?.focus() }, [open])

  function closePanel() {
    onInfoChange(null)
    onOpenChange(false)
    document.getElementById('materials-trigger')?.focus()
  }

  async function download(material: ConversationMaterial) {
    library.clearError()
    setReading(true)
    try {
      const blob = await library.read(material.id)
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = material.name
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      library.reportError('Не удалось скачать файл. Попробуй еще раз.')
    } finally { setReading(false) }
  }

  async function openFile(material: ConversationMaterial) {
    const preview = resolveMaterialPreview(material)
    if (!preview) return
    library.clearError()
    // Reserve the tab during the user gesture, before the asynchronous IndexedDB read.
    const tab = window.open('about:blank', '_blank')
    if (!tab) { library.reportError('Браузер заблокировал новую вкладку. Разреши всплывающие окна или скачай файл.'); return }
    tab.opener = null
    setReading(true)
    try {
      const blob = await library.read(material.id)
      if (!blob) { tab.close(); return }
      // Only inert formats may open in a browser tab. Other files are available as downloads.
      const url = URL.createObjectURL(new Blob([blob], { type: preview.mime }))
      tab.location.replace(url)
      // Keep the URL valid while the browser viewer is using it.
      const timer = setInterval(() => {
        if (tab.closed) { URL.revokeObjectURL(url); clearInterval(timer) }
      }, 1000)
    } catch {
      tab.close()
      library.reportError('Не удалось открыть файл. Попробуй еще раз.')
    } finally { setReading(false) }
  }

  if (!open) return null

  return <Sidebar side="right" collapsible="none" role="complementary" aria-labelledby="materials-title"
    id="materials-sidebar" className="materials-sidebar" onKeyDown={event => {
      if (event.key === 'Escape' && !selected && !event.defaultPrevented) { event.preventDefault(); closePanel() }
    }}>
      <SidebarHeader className="flex-row items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <h2 id="materials-title" ref={headingRef} tabIndex={-1} className="text-base font-semibold outline-none">Библиотека</h2>
          <p className="mt-1 text-xs text-muted-foreground">{picker ? 'Выбери файлы для сообщения' : 'Все загруженные файлы'}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Закрыть библиотеку"
          onClick={closePanel}><X className="size-4" aria-hidden="true" /></Button>
      </SidebarHeader>
      <SidebarContent className="gap-0 p-4" aria-busy={busy}>
        {materials.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center">
          <FolderOpen className="size-8 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
          <p className="max-w-64 text-sm">В библиотеке пока нет файлов</p>
          <p className="max-w-64 text-xs leading-5 text-muted-foreground">Прикрепи файл кнопкой «+» в поле ввода.</p>
        </div> : <ul aria-label="Файлы библиотеки" className="material-library-list">
          {materials.map(material => <li key={material.id} className="material-library-item">
            <button type="button" className="material-library-info outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Информация о файле: ${material.name}`}
              onClick={event => { infoTrigger.current = event.currentTarget; onInfoChange(material.id) }}>
              <FileIcon name={material.name} type={material.type} />
              <span className="min-w-0 flex-1">
                <span className="material-library-name" title={material.name}>{material.name}</span>
                <span className="mt-0.5 block break-words text-xs text-muted-foreground">{materialType(material)} · {formatMaterialSize(material.size)}</span>
                <time dateTime={new Date(material.addedAt).toISOString()} className="mt-1 block text-xs text-muted-foreground">{formatDate(material.addedAt)}</time>
              </span>
              <Info className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
            <div className="material-library-actions">
              {picker ? <Button type="button" variant="outline" size="sm" className="mr-auto h-8 px-2 text-xs"
                disabled={busy || selectedIds.includes(material.id)} onClick={() => onAttach(material.id)}
                aria-label={`${selectedIds.includes(material.id) ? 'Прикреплен' : 'Прикрепить'}: ${material.name}`}>
                {selectedIds.includes(material.id) ? 'Прикреплен' : 'Прикрепить'}
              </Button> : null}
              <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="size-8" aria-label={`Действия с файлом: ${material.name}`}><MoreHorizontal className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled={reading} onSelect={() => void download(material)}><Download className="size-4" aria-hidden="true" />Скачать</DropdownMenuItem>
                  <DropdownMenuItem disabled={busy} onSelect={() => void onRemove(material.id)}><Trash2 className="size-4" aria-hidden="true" />Удалить</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>)}
        </ul>}
      </SidebarContent>
      {picker ? <div className="border-t p-4"><Button type="button" variant="outline" className="w-full" onClick={closePanel}>Готово</Button></div> : null}
      {busy ? <p role="status" className="px-6 pb-4 text-xs text-muted-foreground">Сохраняем изменения…</p> : null}
      {error && !selected ? <p role="alert" className="border-t px-6 py-4 text-sm text-destructive">{error}</p> : null}
      <Dialog open={!!selected} onOpenChange={next => { if (!next) onInfoChange(null) }}>
        {selected ? <DialogContent className="material-file-dialog" onCloseAutoFocus={event => {
          event.preventDefault()
          if (infoTrigger.current?.isConnected) infoTrigger.current.focus()
          else headingRef.current?.focus()
        }}>
          <DialogHeader className="shrink-0 pr-6 text-left">
            <DialogTitle>Информация о файле</DialogTitle>
            <DialogDescription className="line-clamp-2 break-words [overflow-wrap:anywhere]" title={selected.name}>{selected.name}</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="preview" className="material-file-tabs">
            <TabsList aria-label="Информация о файле" className="w-fit shrink-0">
              <TabsTrigger value="preview">Просмотр</TabsTrigger>
              <TabsTrigger value="info">Информация</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="material-file-tab-panel">
              <FilePreview key={selected.id} material={selected} library={library} />
            </TabsContent>
            <TabsContent value="info" className="material-file-tab-panel">
              <dl className="material-file-metadata">
                <dt className="text-muted-foreground">Исходный разговор</dt>
                <dd className="break-words [overflow-wrap:anywhere]">{selected.originId.startsWith('draft:') ? 'Без разговора'
                  : conversations.find(conversation => conversation.id === selected.originId)?.title ?? 'Разговор удален'}</dd>
                <dt className="text-muted-foreground">Тип</dt><dd className="break-words [overflow-wrap:anywhere]">{materialType(selected)}</dd>
                <dt className="text-muted-foreground">Размер</dt><dd>{formatMaterialSize(selected.size)}</dd>
                <dt className="text-muted-foreground">Добавлен</dt><dd>{formatDateTime(selected.addedAt)} МСК</dd>
              </dl>
            </TabsContent>
          </Tabs>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter className="shrink-0 gap-2 sm:space-x-0">
            {resolveMaterialPreview(selected) ? <Button type="button" variant="outline" disabled={reading}
              onClick={() => void openFile(selected)}><ExternalLink className="mr-2 size-4" aria-hidden="true" />Открыть в новой вкладке</Button> : null}
            <Button type="button" variant="outline" disabled={reading} onClick={() => void download(selected)}>
              <Download className="mr-2 size-4" aria-hidden="true" />Скачать</Button>
          </DialogFooter>
        </DialogContent> : null}
      </Dialog>
  </Sidebar>
}
