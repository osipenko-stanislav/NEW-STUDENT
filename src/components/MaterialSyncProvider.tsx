import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useMaterialLibrary } from '@/components/MaterialLibraryProvider'
import { useSettings } from '@/components/SettingsProvider'
import { academicFileName, exportBlob, loadSyncRecord, localMaterialRevision, materialSyncStatus, preparedAcademicFiles, publishedMaterialRevision, syncStorageKey, type SyncRecord, type SyncStatus } from '@/lib/material-sync-demo'

type Value = { status: SyncStatus; progress: number; lastSync: number | null; error: string | null; revision: number;
  synchronize: () => Promise<void>; exportMaterial: (id: string) => Promise<void> }
const Context = createContext<Value | null>(null)
export function MaterialSyncProvider({ children }: { children: ReactNode }) {
  const library = useMaterialLibrary()
  const snapshot = useSyncExternalStore(library.subscribe, library.getSnapshot)
  const { settings } = useSettings()
  const [record, setRecord] = useState(loadSyncRecord)
  const [progress, setProgress] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [ready, setReady] = useState(false)
  const busy = useRef(false)
  const alive = useRef(false)
  const revision = localMaterialRevision(snapshot.materials)
  const persist = useCallback((next: SyncRecord) => {
    localStorage.setItem(syncStorageKey, JSON.stringify(next))
    setRecord(next)
  }, [])
  useEffect(() => {
    alive.current = true
    let cancelled = false
    // Seed an older, complete local copy once. Later checks compare versions,
    // never infer staleness from time since the last synchronization.
    async function initialize() {
      try {
        if (!localMaterialRevision(library.getSnapshot().materials)) {
          const saved = await library.synchronizeAcademic(await preparedAcademicFiles(1), 1)
          if (!saved || cancelled) return
          persist({ version: 1, lastSync: Date.now(), error: null })
        }
      } catch {
        if (!cancelled) setRecord(current => ({ ...current, error: 'Не удалось сохранить учебные материалы. Проверь свободное место.' }))
      } finally { if (!cancelled) setReady(true) }
    }
    void initialize()
    return () => { cancelled = true; alive.current = false }
  }, [library, persist])
  const synchronize = useCallback(async () => {
    if (busy.current || !alive.current) return
    busy.current = true; setSyncing(true); setProgress(0)
    try {
      // Short, deterministic demo progression; existing files remain usable.
      for (const value of [25, 65, 90]) {
        await new Promise(resolve => setTimeout(resolve, 240))
        if (!alive.current) return
        setProgress(value)
      }
      if (!navigator.onLine) throw new Error('offline')
      const saved = await library.synchronizeAcademic(await preparedAcademicFiles(publishedMaterialRevision), publishedMaterialRevision)
      if (!saved || !alive.current) return
      persist({ version: 1, lastSync: Date.now(), error: null })
      setProgress(100)
    } catch {
      if (alive.current) {
        const error = navigator.onLine ? 'Не удалось обновить материалы. Повтори попытку. Сохраненные документы доступны.' : 'Нет подключения. Сохраненные материалы доступны, обновление можно повторить позже.'
        const next: SyncRecord = { version: 1, lastSync: record.lastSync, error }
        try { persist(next) } catch { setRecord(next) }
      }
    } finally { busy.current = false; if (alive.current) setSyncing(false) }
  }, [library, persist, record.lastSync])
  useEffect(() => {
    if (!ready || !settings.downloadAutoSync) return
    const checkVersion = () => {
      if (document.visibilityState === 'visible' && navigator.onLine && localMaterialRevision(library.getSnapshot().materials) < publishedMaterialRevision) void synchronize()
    }
    checkVersion()
    const timer = setInterval(checkVersion, settings.downloadInterval * 60_000)
    window.addEventListener('online', checkVersion)
    document.addEventListener('visibilitychange', checkVersion)
    return () => { clearInterval(timer); window.removeEventListener('online', checkVersion); document.removeEventListener('visibilitychange', checkVersion) }
  }, [ready, library, settings.downloadAutoSync, settings.downloadInterval, synchronize])
  async function exportMaterial(id: string) {
    const material = library.getSnapshot().materials.find(item => item.sourceAcademicId === id)
    if (!material) { library.reportError('Материал еще не сохранен. Обнови учебную базу.'); return }
    const blob = await library.read(material.id)
    if (blob) exportBlob(blob, academicFileName(id))
  }
  return <Context.Provider value={{ status: syncing ? 'syncing' : materialSyncStatus(revision, record.error), progress,
    lastSync: record.lastSync, error: record.error, revision, synchronize, exportMaterial }}>{children}</Context.Provider>
}
export function useMaterialSync() {
  const value = useContext(Context)
  if (!value) throw new Error('MaterialSyncProvider is required')
  return value
}
