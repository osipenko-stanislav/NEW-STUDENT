import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type WidgetPopoverProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  triggerLabel: string
  triggerAriaLabel?: string
  triggerIcon: string
  triggerClassName?: string
  contentClassName: string
  children: ReactNode
}

export default function WidgetPopover({
  open, onOpenChange, title, triggerLabel, triggerAriaLabel = triggerLabel, triggerIcon,
  triggerClassName = '', contentClassName, children,
}: WidgetPopoverProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restoreFocus = useRef(false)
  const suppressFocusOpen = useRef(false)

  useEffect(() => () => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current)
  }, [])

  function cancelClose() {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }

  function changeOpen(nextOpen: boolean) {
    cancelClose()
    if (nextOpen && !open) restoreFocus.current = false
    onOpenChange(nextOpen)
  }

  function openOnHover(event: PointerEvent) {
    if (event.pointerType !== 'touch') changeOpen(true)
  }

  function closeAfterLeave() {
    cancelClose()
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null
      const focused = document.activeElement
      const keyboardFocused = focused === triggerRef.current && triggerRef.current?.matches(':focus-visible')
      if (!keyboardFocused && !contentRef.current?.contains(focused)) onOpenChange(false)
    }, 180)
  }

  function focusContent() {
    const content = contentRef.current
    const action = content?.querySelector<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]')
    const target = action ?? content
    target?.focus({ preventScroll: true })
  }

  return <Popover open={open} onOpenChange={changeOpen}>
    <PopoverTrigger asChild>
      <Button ref={triggerRef} type="button" variant="ghost" className={`status-widget ${triggerClassName}`}
        aria-label={triggerAriaLabel} onPointerEnter={openOnHover} onPointerLeave={closeAfterLeave}
        onFocus={event => {
          if (!suppressFocusOpen.current && event.currentTarget.matches(':focus-visible')) changeOpen(true)
        }}
        onBlur={closeAfterLeave}
        onKeyDown={event => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            changeOpen(true)
            if (contentRef.current) focusContent()
            else requestAnimationFrame(focusContent)
          }
        }}>
        <img src={`${import.meta.env.BASE_URL}assets/figma/${triggerIcon}`} alt="" aria-hidden="true" className="design-icon" />
        <span>{triggerLabel}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent ref={contentRef} className={`widget-popover ${contentClassName}`} side="bottom" align="start"
      sideOffset={8} collisionPadding={16} aria-label={title}
      onPointerEnter={cancelClose} onPointerLeave={closeAfterLeave}
      onFocusCapture={() => { restoreFocus.current = true; cancelClose() }}
      onBlurCapture={closeAfterLeave}
      onInteractOutside={() => { restoreFocus.current = false }}
      onOpenAutoFocus={event => event.preventDefault()}
      onCloseAutoFocus={event => {
        event.preventDefault()
        if (restoreFocus.current) {
          suppressFocusOpen.current = true
          triggerRef.current?.focus({ preventScroll: true })
          suppressFocusOpen.current = false
          restoreFocus.current = false
        }
      }}>
      {children}
    </PopoverContent>
  </Popover>
}
