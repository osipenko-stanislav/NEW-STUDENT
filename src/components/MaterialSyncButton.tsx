import { SyncIcon } from '@/components/ui/sync-icon'
import { StateIcon } from '@/components/ui/state-icon'
import { useTransitionSuccess } from '@/hooks/use-micro-feedback'
import { Check, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useMaterialSync } from '@/components/MaterialSyncProvider'
import { useDisplayFormats } from '@/components/SettingsProvider'
const labels = { current: 'Материалы актуальны', update: 'Есть обновления материалов', syncing: 'Синхронизация материалов', error: 'Не удалось обновить материалы' }
export default function MaterialSyncButton() {
  const { status, progress, lastSync, error, synchronize } = useMaterialSync()
  const success = useTransitionSuccess(status)
  const { formatDateTime } = useDisplayFormats()
  const action = status === 'error' ? 'Повторить обновление' : status === 'syncing' ? 'Обновление выполняется' : 'Обновить материалы'
  return <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
    <Button type="button" variant="ghost" size="icon" className="ghost-icon sync-button" data-status={status}
      aria-label={`${labels[status]}. ${action}`} aria-busy={status === 'syncing'} onClick={() => void synchronize()}>
      <StateIcon state={success ? 'success' : status === 'error' ? 'error' : 'refresh'}>{success ? <Check aria-hidden="true" /> : status === 'error' ? <TriangleAlert aria-hidden="true" /> : <SyncIcon active={status === 'syncing'} />}</StateIcon><span className="sync-status-dot" aria-hidden="true" />
      {status === 'syncing' ? <span className="sync-progress" role="progressbar" aria-label="Обновление материалов" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></span> : null}
      <span className="sr-only" role="status">{labels[status]}</span>
    </Button>
  </TooltipTrigger><TooltipContent className="max-w-72 space-y-1"><p>{labels[status]}</p>
    {lastSync ? <p>Последнее обновление: {formatDateTime(lastSync)} МСК</p> : null}
    {status === 'syncing' ? <p>{progress}%</p> : <p>{action}</p>}
    {error && status === 'error' ? <p>{error}</p> : null}
  </TooltipContent></Tooltip></TooltipProvider>
}
