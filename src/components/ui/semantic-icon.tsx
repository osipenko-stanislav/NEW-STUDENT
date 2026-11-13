import type { HTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SemanticTone = 'violet' | 'green' | 'blue' | 'amber' | 'red' | 'pink' | 'slate'

export function SemanticIcon({ icon: Icon, tone = 'slate', size = 'default', className, ...props }: {
  icon: LucideIcon
  tone?: SemanticTone
  size?: 'default' | 'compact'
} & HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('semantic-tone semantic-icon', className)} data-tone={tone} data-size={size} aria-hidden="true" {...props}>
    <Icon strokeWidth={1.75} />
  </span>
}
