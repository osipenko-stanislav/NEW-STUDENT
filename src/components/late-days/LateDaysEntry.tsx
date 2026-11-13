import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLateDays } from '@/components/LateDaysProvider'
import { currentLateDaysSemester } from '@/data/late-days'
import { academicTasks } from '@/data/academic-data'
import { useDisplayFormats } from '@/components/SettingsProvider'
import LateDaysChart from './LateDaysChart'
export default function LateDaysEntry({ onHistory }: { onHistory: () => void }) {
  const [open, setOpen] = useState(false)
  const { state, balance } = useLateDays()
  const { formatDateTime } = useDisplayFormats()
  const last = state.operations.filter(item => item.semesterId === currentLateDaysSemester.id && item.type === 'debit').at(-1)
  return <Popover open={open} onOpenChange={setOpen}><Tooltip><TooltipTrigger asChild><PopoverTrigger asChild><Button variant="ghost" size="icon" className="ghost-icon late-days-action" aria-label={`Late Days: ${balance.remaining}`}><img src={`${import.meta.env.BASE_URL}assets/figma/calendar-plus01-lined1.svg`} alt="" aria-hidden="true" className="design-icon" /><span>{balance.remaining}</span></Button></PopoverTrigger></TooltipTrigger><TooltipContent>Late Days</TooltipContent></Tooltip>
    <PopoverContent align="end" sideOffset={10} collisionPadding={16} className="late-days-popover" onOpenAutoFocus={event => { event.preventDefault(); document.getElementById('late-days-preview-title')?.focus() }} aria-labelledby="late-days-preview-title">
      <header className="late-days-preview-heading"><h2 id="late-days-preview-title" tabIndex={-1} className="outline-none">Late Days</h2><p>{currentLateDaysSemester.name}</p></header>
      <p className="late-days-balance"><strong key={balance.remaining}>{balance.remaining}</strong><span>из {balance.limit} дней</span></p><p className="late-days-muted">Использовано: {balance.used}</p>
      <LateDaysChart semester={currentLateDaysSemester} compact />
      {last ? <div className="late-days-last"><p>Последний перенос · −{last.days} дн.</p><span>{academicTasks.find(task => task.id === last.taskId)?.title}</span><time dateTime={last.at}>{formatDateTime(last.at, true)}</time></div> : <p className="late-days-muted">Пока нет списаний</p>}
      <Button variant="ghost" className="late-days-history-link" onClick={() => { setOpen(false); onHistory() }}>История Late Days<ArrowRight aria-hidden="true" /></Button>
    </PopoverContent>
  </Popover>
}
