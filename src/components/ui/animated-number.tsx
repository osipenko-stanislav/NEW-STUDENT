import { notificationParameters, recipeTransition } from '@/lib/motion-recipes'
import { useRef } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { useAppMotion } from '@/components/MotionProvider'
import { microOffset } from '@/lib/motion-tokens'

/** Stable digit slots: only the changed glyph is replaced, never the label. */
export function AnimatedNumber({ value, minDigits = 1, variant = 'subtle', animateInitial = false, formatValue = String }: { value: number; minDigits?: number; variant?: 'subtle' | 'notification'; animateInitial?: boolean; formatValue?: (value: number) => string }) {
  const { effectiveIntensity, spatialMotion } = useAppMotion()
  const previous = useRef(value)
  const direction = useRef(1)
  if (value !== previous.current) { direction.current = value > previous.current ? 1 : -1; previous.current = value }
  const n = notificationParameters(effectiveIntensity)
  const distance = (variant === 'notification' ? n.digits.distance * n.amplitude : microOffset(effectiveIntensity)) * direction.current
  const width = useRef(minDigits)
  const text = formatValue(value)
  width.current = Math.max(width.current, text.length)
  const digits = text.padStart(width.current, ' ').split('')
  return <span className="animated-number" data-value={value}><span className="sr-only">{text}</span><span aria-hidden="true" className="animated-number-digits">{digits.map((digit, index) => <span className="animated-number-slot" key={width.current - index}>
    {!spatialMotion ? <span className="animated-number-digit">{digit === ' ' ? '\u00a0' : digit}</span> : <AnimatePresence initial={animateInitial} mode="popLayout"><m.span key={digit} className="animated-number-digit" initial={{ opacity: 0, y: distance, filter: variant === 'notification' ? `blur(${n.digits.blur}px)` : 'blur(0px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -distance, transition: variant === 'notification' ? { duration: n.close.duration / 1000, ease: [...n.close.ease] } : recipeTransition('counter', effectiveIntensity, true) }} transition={variant === 'notification' ? { duration: n.digits.duration / 1000, delay: index * n.digits.stagger / 1000, ease: [...n.digits.ease] } : recipeTransition('counter', effectiveIntensity)}>{digit === ' ' ? '\u00a0' : digit}</m.span></AnimatePresence>}
  </span>)}</span></span>
}
