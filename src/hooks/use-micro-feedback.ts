import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useAppMotion } from '@/components/MotionProvider'
import { feedbackHold } from '@/lib/motion-tokens'
import { recipe } from '@/lib/motion-recipes'
/** Applies feedback only after a committed value changes; rerenders stay inert. */
export function useMicroFeedback(ref: RefObject<HTMLElement | null>, value?: string | number) {
  const { effectiveIntensity } = useAppMotion()
  const previous = useRef<string | number | undefined>(undefined)
  const animation = useRef<Animation | null>(null)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    // Ignore exiting/visual copies: their DOM removal is not a new product state.
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, { acceptNode: text => text.parentElement?.closest('[aria-hidden="true"]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT })
    let text = '', part: Node | null
    while ((part = walker.nextNode())) text += part.textContent
    const next = value ?? `${text}|${node.dataset.variant}`
    if (effectiveIntensity === 'minimal') animation.current?.cancel()
    if (previous.current !== undefined && next !== previous.current) {
      animation.current?.cancel()
      if (effectiveIntensity !== 'minimal') animation.current = node.animate([{ opacity: .65 }, { opacity: 1 }], { duration: recipe('status', effectiveIntensity).duration, easing: `cubic-bezier(${recipe('status', effectiveIntensity).ease.join(',')})` })
    }
    previous.current = next
  })
  useEffect(() => () => animation.current?.cancel(), [])
}
export function useTransitionSuccess(status: string) {
  const previous = useRef(status)
  const [success, setSuccess] = useState(false)
  useEffect(() => {
    if (previous.current === 'syncing' && status === 'current') setSuccess(true)
    else if (status !== 'current') setSuccess(false)
    previous.current = status
  }, [status])
  useEffect(() => { if (success) { const timer = setTimeout(() => setSuccess(false), feedbackHold); return () => clearTimeout(timer) } }, [success])
  return success
}
export function useChangeSignal(value: number) {
  const [previous, setPrevious] = useState(value)
  const [revision, setRevision] = useState(0)
  if (previous !== value) { setPrevious(value); if (value > previous) setRevision(current => current + 1) }
  return revision
}
