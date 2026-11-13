import { Clock3, CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
export default function HomeworkModeBadge({ minutes }: { minutes?: number }) {
  return <Badge variant="outline" className="course-homework-mode-badge gap-1.5 shrink-0">{minutes ? <Clock3 className="size-3.5" aria-hidden="true" /> : <CalendarDays className="size-3.5" aria-hidden="true" />}{minutes ? `С таймером · ${minutes / 60} часа` : 'Без таймера'}</Badge>
}
