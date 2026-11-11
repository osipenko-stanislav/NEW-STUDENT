import type { GenerativePart } from '@/types/assistant'
import AssignmentsResponse from './AssignmentsResponse'
import MaterialsResponse from './MaterialsResponse'
import ScheduleResponse from './ScheduleResponse'

export default function GenerativeContent({ part, onNavigate }: { part: GenerativePart; onNavigate: (section: string) => void }) {
  switch (part.type) {
    case 'schedule': return <ScheduleResponse part={part} onNavigate={onNavigate} />
    case 'assignments': return <AssignmentsResponse part={part} onNavigate={onNavigate} />
    case 'materials': return <MaterialsResponse part={part} onNavigate={onNavigate} />
  }
}
