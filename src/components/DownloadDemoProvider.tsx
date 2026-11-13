import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Download, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useSettings, useDisplayFormats } from '@/components/SettingsProvider'
import { courses } from '@/data/course-catalog'
import { academicMaterials } from '@/data/academic-data'
import { lessonsForCourse } from '@/data/course-curricula'

type Mode = 'pack' | 'sync' | 'file'
type Run = { mode: Mode; title: string; phase: 'running' | 'done' | 'cancelled'; progress: number }
type Value = { run: Run | null; lastSync: number | null; error: string | null; start: (mode: Mode, title?: string, silent?: boolean) => void; show: () => void }
const Context = createContext<Value | null>(null)
const key = 'student-download-demo:v1'
export const packSummary = { courses: courses.length, files: academicMaterials.length, lectures: courses.reduce((sum, course) => sum + lessonsForCourse(course.id).length, 0) }
export function DownloadDemoProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const { formatDateTime } = useDisplayFormats()
  const [run, setRun] = useState<Run | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<number | null>(() => {
    try { const value = JSON.parse(localStorage.getItem(key) ?? 'null'); return typeof value?.lastSync === 'number' && value.lastSync > 0 && Number.isFinite(value.lastSync) && !Number.isNaN(new Date(value.lastSync).getTime()) ? value.lastSync : null } catch { return null }
  })
  const busy = useRef(false)
  const start = useCallback((mode: Mode, title?: string, silent = false) => {
    if (busy.current) { if (!silent) setOpen(true); return }
    busy.current = true
    setError(null)
    setRun({ mode, title: title ?? (mode === 'sync' ? 'Синхронизация материалов' : 'Весь пакет учебных материалов'), phase: 'running', progress: 0 })
    if (!silent) setOpen(true)
  }, [])
  const mode = run?.mode
  const phase = run?.phase
  useEffect(() => {
    if (phase !== 'running') return
    let progress = 0
    const timer = setInterval(() => {
      progress = Math.min(100, progress + 20)
      setRun(current => current ? { ...current, progress, phase: progress === 100 ? 'done' : 'running' } : null)
      if (progress === 100) {
        busy.current = false
        if (mode === 'sync') {
          const value = Date.now()
          setLastSync(value)
          try { localStorage.setItem(key, JSON.stringify({ version: 1, lastSync: value })) }
          catch { setError('Не удалось сохранить время синхронизации. Проверь доступ к хранилищу браузера.') }
        }
        clearInterval(timer)
      }
    }, 500)
    return () => clearInterval(timer)
  }, [phase, mode])
  useEffect(() => {
    if (!settings.downloadAutoSync || !settings.downloadFolder) return
    const check = () => {
      if (document.visibilityState === 'visible' && !busy.current && (!lastSync || Date.now() - lastSync >= settings.downloadInterval * 60000)) start('sync', undefined, true)
    }
    check()
    const timer = setInterval(check, 60000)
    document.addEventListener('visibilitychange', check)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', check) }
  }, [settings.downloadAutoSync, settings.downloadFolder, settings.downloadInterval, lastSync, start])
  function cancel() { busy.current = false; setRun(current => current ? { ...current, phase: 'cancelled' } : null) }
  return <Context.Provider value={{ run, lastSync, error, start, show: () => setOpen(true) }}>{children}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="download-demo-dialog"><DialogHeader><div className="flex items-center gap-2"><DialogTitle>{run?.mode === 'sync' ? 'Синхронизация материалов' : 'Скачивание материалов'}</DialogTitle></div><DialogDescription>Лекции, файлы и результаты по твоим курсам.</DialogDescription></DialogHeader>
      <p className="text-sm font-medium break-words">{run?.title}</p>
      {run?.mode !== 'file' ? <dl className="download-pack-summary"><div><dt>Курсы</dt><dd>{packSummary.courses}</dd></div><div><dt>Лекции</dt><dd>{packSummary.lectures}</dd></div><div><dt>Файлы</dt><dd>{packSummary.files}</dd></div></dl> : null}
      <p className="flex items-start gap-2 text-sm text-muted-foreground"><FolderOpen aria-hidden="true" className="size-4 shrink-0 mt-0.5" /><span className="break-all">{settings.downloadFolder || 'Загрузки / NEW STUDENT'}</span></p>
      <div role="progressbar" aria-label="Подготовка материалов" aria-valuemin={0} aria-valuemax={100} aria-valuenow={run?.progress ?? 0} className="download-demo-progress"><span style={{ width: `${run?.progress ?? 0}%` }} /></div>
      <p role="status" className="text-sm">{phase === 'done' ? (run?.mode === 'sync' ? 'Материалы синхронизированы' : 'Материалы скачаны') : phase === 'cancelled' ? 'Процесс остановлен' : (run?.progress ?? 0) < 40 ? 'Собираем структуру курсов…' : (run?.progress ?? 0) < 80 ? 'Подготавливаем лекции и файлы…' : 'Проверяем актуальность данных…'} {phase === 'running' ? `${run?.progress}%` : null}</p>
      {lastSync && run?.mode === 'sync' && phase === 'done' ? <p className="text-xs text-muted-foreground">Последняя синхронизация: {formatDateTime(lastSync)} МСК</p> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="flex justify-end gap-2">{phase === 'running' ? <Button variant="outline" onClick={cancel}>Остановить</Button> : <Button variant="outline" onClick={() => start(mode ?? 'pack', run?.title)}>Повторить</Button>}<Button onClick={() => setOpen(false)}>Закрыть</Button></div>
    </DialogContent></Dialog>
  </Context.Provider>
}
export function useDownloadDemo() { const value = useContext(Context); if (!value) throw new Error('DownloadDemoProvider is required'); return value }
export function DownloadPackButton() {
  const { start, run } = useDownloadDemo()
  return <Button type="button" variant="outline" onClick={() => start('pack')}><Download aria-hidden="true" />{run?.phase === 'running' ? 'Показать процесс' : 'Скачать все материалы'}</Button>
}
