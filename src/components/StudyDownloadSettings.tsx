import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSettings, useDisplayFormats } from '@/components/SettingsProvider'
import { useMaterialSync } from '@/components/MaterialSyncProvider'
export default function StudyDownloadSettings() {
  const { settings, updateSettings, error: settingsError } = useSettings()
  const { formatDateTime } = useDisplayFormats()
  const { status, progress, synchronize, lastSync, error } = useMaterialSync()
  const busy = status === 'syncing'
  return <section className="settings-group" aria-labelledby="study-sync-title"><div className="settings-group-heading"><h3 id="study-sync-title">Учебные материалы</h3><p>Документы и вложения курсов сохраняются в NEW STUDENT на этом устройстве. Личные файлы хранятся отдельно.</p></div><Card className="settings-group-card">
    <div className="settings-row"><div className="settings-row-copy"><label htmlFor="study-auto-sync" className="settings-row-title">Автоматическая синхронизация</label><p className="settings-row-description">Проверяет версии учебных материалов и обновляет локальные копии, пока приложение открыто.</p></div><div className="settings-row-control"><Switch id="study-auto-sync" checked={settings.downloadAutoSync} onCheckedChange={downloadAutoSync => updateSettings({ downloadAutoSync })} /></div></div>
    <div className="settings-row border-t"><div className="settings-row-copy"><label htmlFor="study-sync-interval" className="settings-row-title">Проверка обновлений</label></div><div className="settings-row-control"><Select value={String(settings.downloadInterval)} onValueChange={value => updateSettings({ downloadInterval: Number(value) as 15 | 30 | 60 })} disabled={!settings.downloadAutoSync}><SelectTrigger id="study-sync-interval" className="settings-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="15">Каждые 15 минут</SelectItem><SelectItem value="30">Каждые 30 минут</SelectItem><SelectItem value="60">Каждый час</SelectItem></SelectContent></Select></div></div>
    <div className="settings-row border-t"><div className="settings-row-copy"><div className="settings-row-title">Состояние материалов</div><p className="settings-row-description" role="status">{busy ? `Обновление: ${progress}%` : status === 'error' ? 'Не удалось обновить материалы' : status === 'update' ? 'Есть обновления материалов' : 'Материалы актуальны'}</p>{lastSync ? <p className="settings-row-description">Последнее обновление: {formatDateTime(lastSync)} МСК</p> : null}</div><div className="settings-row-control"><Button variant="outline" disabled={busy} onClick={() => void synchronize()}><RefreshCw aria-hidden="true" />{busy ? 'Обновляем…' : status === 'error' ? 'Повторить' : 'Обновить'}</Button></div></div>
  </Card>{error || settingsError ? <p role="alert" className="mt-3 text-sm text-destructive">{error || settingsError}</p> : null}</section>
}
