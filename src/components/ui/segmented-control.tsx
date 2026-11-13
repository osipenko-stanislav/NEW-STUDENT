import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** A shared surface for independent single-choice buttons; selection remains
 * owned by each scenario through aria-pressed (or Radix data-state). */
export const SegmentedControl = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} role="group" data-slot="segmented-control"
    className={cn('segmented-control', className)} {...props} />,
)
SegmentedControl.displayName = 'SegmentedControl'
