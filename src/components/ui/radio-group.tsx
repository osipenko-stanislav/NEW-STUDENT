import { SelectionIndicator, useSelectionIndicator } from '@/hooks/use-selection-indicator'
import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

const RadioGroup = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Root>, React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>>(
  ({ className, children, ...props }, ref) => {
    const host = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(ref, () => host.current!)
    const position = useSelectionIndicator(host)
    return <RadioGroupPrimitive.Root ref={host} data-has-indicator={!!position} className={cn('grid gap-2', className)} {...props}>{className?.includes('segmented-control') ? <SelectionIndicator position={position} /> : null}{children}</RadioGroupPrimitive.Root>
  },
)
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName
const RadioGroupItem = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Item>, React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>>(
  ({ className, children, ...props }, ref) => <RadioGroupPrimitive.Item ref={ref} data-slot="radio" className={cn('size-4 rounded-full border border-primary text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', className)} {...props}>
    {children ?? <RadioGroupPrimitive.Indicator forceMount className="radio-indicator flex items-center justify-center"><Circle className="size-2.5 fill-current" /></RadioGroupPrimitive.Indicator>}
  </RadioGroupPrimitive.Item>,
)
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName
export { RadioGroup, RadioGroupItem }
