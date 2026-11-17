import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

type CardProps = React.HTMLAttributes<HTMLDivElement> & { size?: 'default' | 'sm' }
const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, size = 'default', ...props }, ref) => (
  <div ref={ref} data-slot="card" data-size={size} className={cn('text-card-foreground', className)} {...props} />
))
Card.displayName = 'Card'
function section(slot: string, name: string) {
  const Component = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }>(({ className, asChild, ...props }, ref) => {
    const Element = asChild ? Slot : 'div'
    return <Element ref={ref} data-slot={slot} className={cn('min-w-0', className)} {...props} />
  })
  Component.displayName = name
  return Component
}
const CardHeader = section('card-header', 'CardHeader')
const CardContent = section('card-content', 'CardContent')
const CardFooter = section('card-footer', 'CardFooter')
export { Card, CardHeader, CardContent, CardFooter }
