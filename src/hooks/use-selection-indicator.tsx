import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
export function useSelectionIndicator(ref: RefObject<HTMLElement | null>) {
  const previous = useRef<Element | null>(null)
  const [position, setPosition] = useState<{ x: number; y: number; width: number; height: number; moving: boolean } | null>(null)
  useLayoutEffect(() => {
    const host = ref.current
    if (!host) return
    function measure() {
      const active = [...host!.children].find(child => child.matches('[data-state="active"], [data-state="checked"], [aria-pressed="true"]'))
      if (!active) { previous.current = null; setPosition(null); return }
      const box = active.getBoundingClientRect(), parent = host!.getBoundingClientRect()
      if (!box.width) return
      const next = { x: box.x - parent.x + host!.scrollLeft - host!.clientLeft, y: box.y - parent.y + host!.scrollTop - host!.clientTop, width: box.width, height: box.height, moving: !!previous.current && previous.current !== active }
      previous.current = active
      setPosition(old => old && old.x === next.x && old.y === next.y && old.width === next.width && old.height === next.height ? old : next)
    }
    measure()
    const mutation = new MutationObserver(measure)
    mutation.observe(host, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-pressed', 'data-state'] })
    const resize = new ResizeObserver(measure)
    resize.observe(host)
    for (const child of host.children) resize.observe(child)
    document.fonts.ready.then(() => { if (host.isConnected) measure() })
    return () => { mutation.disconnect(); resize.disconnect() }
  }, [ref])
  return position
}
export function SelectionIndicator({ position }: { position: ReturnType<typeof useSelectionIndicator> }) {
  return position ? <span aria-hidden="true" data-slot="selection-indicator" data-moving={position.moving} style={{ transform: `translate(${position.x}px, ${position.y}px)`, width: position.width, height: position.height }} /> : null
}
