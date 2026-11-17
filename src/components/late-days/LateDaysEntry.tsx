import { AnimatedNumber } from '@/components/ui/animated-number'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { PreviewPopoverContent } from '@/components/ui/preview-popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLateDays } from '@/components/LateDaysProvider'
import { currentLateDaysSemester } from '@/data/late-days'
import { academicTasks } from '@/data/academic-data'
import { useDisplayFormats } from '@/components/SettingsProvider'
import LateDaysChart from './LateDaysChart'
export default function LateDaysEntry({ onHistory }: { onHistory: () => void }) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const { state, balance } = useLateDays()
  const { formatDateTime } = useDisplayFormats()
  const last = state.operations.filter(item => item.semesterId === currentLateDaysSemester.id && item.type === 'debit').at(-1)
  return <Popover open={open} onOpenChange={setOpen}><Tooltip><TooltipTrigger asChild><PopoverTrigger asChild><Button variant="ghost" size="icon" className="ghost-icon late-days-action" aria-label={`Late Days: ${balance.remaining}`}><img src={`${import.meta.env.BASE_URL}assets/figma/calendar-plus01-lined1.svg`} alt="" aria-hidden="true" className="design-icon" /><span><AnimatedNumber value={balance.remaining} minDigits={2} /></span></Button></PopoverTrigger></TooltipTrigger><TooltipContent>Late Days</TooltipContent></Tooltip>
    <PreviewPopoverContent ref={contentRef} tabIndex={-1} title="Late Days" meta={currentLateDaysSemester.name} className="late-days-popover"
      onOpenAutoFocus={event => { event.preventDefault(); contentRef.current?.focus() }}
      action={{ label: 'История Late Days', onClick: () => { setOpen(false); onHistory() } }}>
      <div className="late-days-preview-content">
      <p className="late-days-balance"><strong ><AnimatedNumber value={balance.remaining} minDigits={2} /></strong><span>из {balance.limit} дней</span></p><p className="late-days-muted">Использовано: <AnimatedNumber value={balance.used} minDigits={2} /></p>
      <LateDaysChart semester={currentLateDaysSemester} compact />
      {last ? <div className="late-days-last"><p>Последний перенос · −{last.days} дн.</p><span>{academicTasks.find(task => task.id === last.taskId)?.title}</span><time dateTime={last.at}>{formatDateTime(last.at, true)}</time></div> : <p className="late-days-muted">Пока нет списаний</p>}
      </div>
    </PreviewPopoverContent>
  </Popover>
}
