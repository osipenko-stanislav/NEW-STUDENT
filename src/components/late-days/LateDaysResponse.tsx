import type { LateDaysPart } from '@/types/assistant'
import { useLateDays } from '@/components/LateDaysProvider'
import { currentLateDaysSemester } from '@/data/late-days'
import { Button } from '@/components/ui/button'
import { navigate } from '@/hooks/use-navigation'
import LateDaysChart from './LateDaysChart'
import RescuePlanner from './RescuePlanner'
export default function LateDaysResponse({ part }: { part: LateDaysPart }) {
  const { balance } = useLateDays()
  if (part.mode === 'rescue') return <RescuePlanner planId={part.planId} strategy={part.strategy} embedded />
  return <section className="gen-ui late-days-response" aria-label="Late Days"><h3>Late Days · {currentLateDaysSemester.name}</h3><p className="late-days-balance"><strong key={balance.remaining}>{balance.remaining}</strong><span>из {balance.limit} дней</span></p><p className="late-days-muted">Использовано: {balance.used}</p><LateDaysChart semester={currentLateDaysSemester} compact /><Button variant="outline" onClick={() => navigate({ section: 'Late Days' })}>История Late Days</Button></section>
}
