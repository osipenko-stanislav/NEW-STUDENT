import { forwardRef, useImperativeHandle, useRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { SelectionIndicator, useSelectionIndicator } from '@/hooks/use-selection-indicator'
export const SegmentedControl = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const host = useRef<HTMLDivElement>(null)
    useImperativeHandle(ref, () => host.current!)
    const position = useSelectionIndicator(host)
    return <div ref={host} role="group" data-slot="segmented-control" data-has-indicator={!!position} className={cn('segmented-control', className)} {...props}><SelectionIndicator position={position} />{children}</div>
  },
)
SegmentedControl.displayName = 'SegmentedControl'
