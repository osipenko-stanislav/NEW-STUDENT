import LateDaysResponse from '@/components/late-days/LateDaysResponse'
import { resolveStudyPart } from '@/lib/study-projections'
import type { GenerativePart } from '@/types/assistant'
import AssignmentsResponse from './AssignmentsResponse'
import MaterialsResponse from './MaterialsResponse'
import ScheduleResponse from './ScheduleResponse'
import { m } from 'motion/react'
import { useAppMotion } from '@/components/MotionProvider'

export default function GenerativeContent({ part, onNavigate, animate = false }: { part: GenerativePart; onNavigate: (section: string) => void; animate?: boolean }) {
  const { effectiveIntensity, spatialMotion, transition } = useAppMotion()
  part = resolveStudyPart(part)
  const content = part.type === 'late-days' ? <LateDaysResponse part={part} /> : part.type === 'schedule' ? <ScheduleResponse part={part} onNavigate={onNavigate} />
    : part.type === 'assignments' ? <AssignmentsResponse part={part} onNavigate={onNavigate} />
      : <MaterialsResponse part={part} onNavigate={onNavigate} />
  return <m.div initial={animate ? spatialMotion ? { opacity: 0, y: effectiveIntensity === 'expressive' ? 12 : 6 } : { opacity: 0 } : false}
    animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: animate && effectiveIntensity !== 'minimal' ? 0.06 : 0 }}>
    {content}
  </m.div>
}
