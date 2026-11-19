import { AnimatedNumber } from '@/components/ui/animated-number'
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
  return <section className="gen-ui late-days-response" aria-label="Late Days">
    <div className="gen-header"><h3>Late Days</h3><p>{currentLateDaysSemester.name}</p></div>
    <div className="gen-late-days-analysis"><div className="gen-late-days-resource"><p className="late-days-balance"><strong><AnimatedNumber value={balance.remaining} minDigits={2} /></strong><span>дней осталось<br />из {balance.limit}</span></p><p className="late-days-muted">Использовано: <AnimatedNumber value={balance.used} minDigits={2} /></p></div><LateDaysChart semester={currentLateDaysSemester} compact /></div>
    <div className="gen-footer"><Button variant="outline" onClick={() => navigate({ section: 'Late Days' })}>История Late Days</Button></div>
  </section>
}
