import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { PreviewPopoverContent } from '@/components/ui/preview-popover'

type WidgetPopoverProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  meta?: ReactNode
  action?: { label: string; onClick: () => void }
  triggerLabel: string
  triggerAriaLabel?: string
  triggerIcon: string
  triggerIconNode?: ReactNode
  triggerClassName?: string
  contentClassName: string
  children: ReactNode
}

export default function WidgetPopover({ open, onOpenChange, title, meta, action, triggerLabel,
  triggerAriaLabel = triggerLabel, triggerIcon, triggerClassName = '', triggerIconNode, contentClassName, children,
}: WidgetPopoverProps) {
  return <Popover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger asChild>
      <Button type="button" variant="ghost" className={`status-widget ${triggerClassName}`} aria-label={triggerAriaLabel}>
        {triggerIconNode ?? <img src={`${import.meta.env.BASE_URL}assets/figma/${triggerIcon}`} alt="" aria-hidden="true" className="design-icon" />}
        <span>{triggerLabel}</span>
      </Button>
    </PopoverTrigger>
    <PreviewPopoverContent title={title} meta={meta} align="start" className={contentClassName}
      action={action ? { ...action, onClick: () => { onOpenChange(false); action.onClick() } } : undefined}>
      {children}
    </PreviewPopoverContent>
  </Popover>
}
