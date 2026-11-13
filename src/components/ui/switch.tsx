import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { m } from 'motion/react'
import { useAppMotion } from '@/components/MotionProvider'
import { microSpring } from '@/lib/motion-tokens'
import { cn } from '@/lib/utils'
const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>>(
  ({ className, checked, defaultChecked, onCheckedChange, ...props }, ref) => {
    const [local, setLocal] = React.useState(defaultChecked ?? false)
    const value = checked ?? local
    const { effectiveIntensity } = useAppMotion()
    return <SwitchPrimitive.Root ref={ref} data-slot="switch" checked={value} onCheckedChange={next => { setLocal(next); onCheckedChange?.(next) }} className={cn('peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input', className)} {...props}>
      <SwitchPrimitive.Thumb asChild><m.span data-slot="switch-thumb" initial={false} animate={{ x: value ? 16 : 0 }} transition={microSpring(effectiveIntensity)} className="pointer-events-none block size-5 rounded-full bg-background shadow-sm" /></SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  },
)
Switch.displayName = SwitchPrimitive.Root.displayName
export { Switch }
