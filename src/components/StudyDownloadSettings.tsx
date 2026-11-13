import { useState } from 'react'
import { FolderOpen, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useSettings, useDisplayFormats } from '@/components/SettingsProvider'
import { DownloadPackButton, useDownloadDemo } from '@/components/DownloadDemoProvider'
export default function StudyDownloadSettings() {
  const { settings, updateSettings, error: settingsError } = useSettings()
  const { formatDateTime } = useDisplayFormats()
  const { run, start, lastSync, error } = useDownloadDemo()
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState('')
  const busy = run?.phase === 'running'
  return <section className="settings-group" aria-labelledby="study-download-title"><div className="settings-group-heading"><h3 id="study-download-title">Учебные материалы</h3><p>Пакет включает все курсы, тексты лекций, файлы и ведомости.</p></div><Card className="settings-group-card">
    <div className="settings-row"><FolderOpen className="settings-row-icon" aria-hidden="true" /><div className="settings-row-copy"><div className="settings-row-title">Папка-репозиторий</div><p className="settings-row-description break-all">{settings.downloadFolder || 'Папка не выбрана'}</p></div><div className="settings-row-control"><Button type="button" variant="outline" disabled={busy} onClick={() => { setPath(settings.downloadFolder); setOpen(true) }}>{settings.downloadFolder ? 'Изменить папку' : 'Указать папку'}</Button></div></div>
    <div className="settings-row border-t"><div className="settings-row-copy"><label htmlFor="study-auto-sync" className="settings-row-title">Автоматическая синхронизация</label><p className="settings-row-description">Обновляет материалы в выбранной папке, пока LMS открыт.</p></div><div className="settings-row-control"><Switch id="study-auto-sync" disabled={!settings.downloadFolder} checked={settings.downloadAutoSync} onCheckedChange={downloadAutoSync => updateSettings({ downloadAutoSync })} /></div></div>
    <div className="settings-row border-t"><div className="settings-row-copy"><label htmlFor="study-sync-interval" className="settings-row-title">Периодичность</label></div><div className="settings-row-control"><Select value={String(settings.downloadInterval)} onValueChange={value => updateSettings({ downloadInterval: Number(value) as 15 | 30 | 60 })} disabled={!settings.downloadFolder || !settings.downloadAutoSync}><SelectTrigger id="study-sync-interval" className="settings-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="15">Каждые 15 минут</SelectItem><SelectItem value="30">Каждые 30 минут</SelectItem><SelectItem value="60">Каждый час</SelectItem></SelectContent></Select></div></div>
    <div className="settings-row border-t"><div className="settings-row-copy"><div className="settings-row-title">Состояние синхронизации</div><p className="settings-row-description" role="status">{busy ? `Синхронизация: ${run.progress}%` : lastSync ? `Последняя синхронизация: ${formatDateTime(lastSync)} МСК` : 'Синхронизация еще не запускалась'}</p></div><div className="settings-row-control"><Button variant="outline" disabled={!settings.downloadFolder} onClick={() => start('sync')}><RefreshCw aria-hidden="true" />{busy ? 'Показать процесс' : 'Синхронизировать'}</Button></div></div>
    <div className="settings-row border-t"><div className="settings-row-copy"><div className="settings-row-title">Весь пакет материалов</div><p className="settings-row-description">Структура курсов, лекции, файлы и результаты.</p></div><div className="settings-row-control"><DownloadPackButton /></div></div>
  </Card>{error || settingsError ? <p role="alert" className="mt-3 text-sm text-destructive">{error || settingsError}</p> : null}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Папка-репозиторий</DialogTitle><DialogDescription>Укажи папку для учебных материалов.</DialogDescription></DialogHeader><form onSubmit={event => { event.preventDefault(); if (path.trim() && updateSettings({ downloadFolder: path.trim() })) setOpen(false) }}><label htmlFor="study-folder-path" className="text-sm font-medium">Путь к папке</label><Input id="study-folder-path" className="mt-2" value={path} onChange={event => setPath(event.target.value)} placeholder="~/Documents/NEW STUDENT" maxLength={512} /><div className="flex justify-end gap-2 mt-5"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Отмена</Button><Button type="submit" disabled={!path.trim()}>Сохранить</Button></div></form></DialogContent></Dialog>
  </section>
}
