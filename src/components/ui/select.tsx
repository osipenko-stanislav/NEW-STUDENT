import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger ref={ref} className={cn(
    'select-trigger flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-none outline-none transition-colors hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-ring [&>span:first-child]:min-w-0 [&>span:first-child]:flex-1 [&>span:first-child]:truncate [&>span:first-child]:text-left',
    className,
  )} {...props}>
    {children}
    <SelectPrimitive.Icon asChild><ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton ref={ref} className={cn('flex h-6 cursor-default items-center justify-center', className)} {...props}>
    <ChevronUp className="size-4" aria-hidden="true" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton ref={ref} className={cn('flex h-6 cursor-default items-center justify-center', className)} {...props}>
    <ChevronDown className="size-4" aria-hidden="true" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', sideOffset = 4, collisionPadding = 8, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content ref={ref} position={position} sideOffset={sideOffset} collisionPadding={collisionPadding}
      className={cn(
        'select-content relative z-50 max-h-[min(320px,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] min-w-32 max-w-[calc(100vw-16px)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md origin-[--radix-select-content-transform-origin] [transition-duration:calc(200ms*var(--motion-scale))] [animation-duration:calc(200ms*var(--motion-scale))] [transition-timing-function:var(--ease-enter)] [animation-timing-function:var(--ease-enter)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:[transition-duration:calc(150ms*var(--motion-scale))] data-[state=closed]:[animation-duration:calc(150ms*var(--motion-scale))] data-[state=closed]:[transition-timing-function:var(--ease-exit)] data-[state=closed]:[animation-timing-function:var(--ease-exit)] data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
        className,
      )} {...props}>
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => <SelectPrimitive.Label ref={ref} className={cn('px-2 py-2 text-xs text-muted-foreground', className)} {...props} />)
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item ref={ref} className={cn(
    'relative flex min-h-9 w-full cursor-default select-none items-center rounded-md py-2 pl-8 pr-2 text-sm leading-5 outline-none transition-colors [transition-duration:calc(150ms*var(--motion-scale))] [animation-duration:calc(150ms*var(--motion-scale))] data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    className,
  )} {...props}>
    <span className="absolute left-2 flex size-4 items-center justify-center"><SelectPrimitive.ItemIndicator><Check className="size-4" aria-hidden="true" /></SelectPrimitive.ItemIndicator></span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectScrollUpButton, SelectScrollDownButton }
