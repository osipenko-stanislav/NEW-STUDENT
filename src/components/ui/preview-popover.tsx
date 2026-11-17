import { useId, type ComponentProps, type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { PopoverContent } from './popover'
import { Button } from './button'

type PreviewPopoverProps = Omit<ComponentProps<typeof PopoverContent>, 'title'> & {
  title: string
  meta?: ReactNode
  action?: { label: string; onClick: () => void }
}

/** Shared quick-view composition, based on the notifications preview. */
export function PreviewPopoverContent({ title, meta, action, children, className = '', ...props }: PreviewPopoverProps) {
  const titleId = useId()
  return <PopoverContent align="end" sideOffset={10} collisionPadding={16} {...props}
    className={`preview-popover ${className}`} aria-labelledby={titleId}>
    <header className="preview-popover-heading"><h2 id={titleId}>{title}</h2>{meta ? <span className="preview-popover-meta">{meta}</span> : null}</header>
    <div className="preview-popover-body">{children}</div>
    {action ? <Button type="button" variant="ghost" className="preview-popover-action" onClick={action.onClick}>{action.label}<ArrowRight aria-hidden="true" /></Button> : null}
  </PopoverContent>
}
