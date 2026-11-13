import { useLateDays } from '@/components/LateDaysProvider'
import { lateDaysMonths } from '@/lib/late-days'
import type { LateDaysSemester } from '@/data/late-days'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
export default function LateDaysChart({ semester, compact = false }: { semester: LateDaysSemester; compact?: boolean }) {
  const { state } = useLateDays()
  const all = lateDaysMonths(state, semester)
  const months = compact ? all.slice(-3) : all
  const scale = Math.max(1, ...all.map(item => item.limit))
  return <figure className={`late-days-chart ${compact ? 'late-days-chart-compact' : ''}`} aria-label="Late Days по месяцам: использовано и осталось">
    <div className="late-days-columns">{months.map(month => <Tooltip key={month.id}><TooltipTrigger asChild><button type="button" className="late-days-month" aria-label={`${month.label}: использовано ${month.used}, осталось ${month.remaining}, лимит ${month.limit}`}>
      <span className="late-days-column-track"><span className="late-days-column" style={{ height: `${month.limit / scale * 100}%` }}><span className="late-days-segment late-days-remaining" style={{ flex: month.remaining }} /><span className="late-days-segment late-days-used" style={{ flex: month.used }} /></span></span><span>{month.label}</span>
    </button></TooltipTrigger><TooltipContent><p>{month.label}: использовано {month.used}, осталось {month.remaining}</p><p>Лимит: {month.limit}</p></TooltipContent></Tooltip>)}</div>
    <figcaption className="late-days-legend"><span><i className="late-days-used" />Использовано</span><span><i className="late-days-remaining" />Осталось</span></figcaption>
  </figure>
}
