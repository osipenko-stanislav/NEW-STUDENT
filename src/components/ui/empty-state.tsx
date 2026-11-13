import type { HTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  icon: LucideIcon
  title: string
  description: ReactNode
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action, className, ...props }: EmptyStateProps) {
  return <div data-slot="empty-state" className={cn('empty-state', className)} {...props}>
    <Icon className="size-7 text-muted-foreground" aria-hidden="true" />
    <h2>{title}</h2>
    <p>{description}</p>
    {action}
  </div>
}
