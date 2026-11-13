import { useNotificationSound } from '@/hooks/use-notification-sound'
import { AnimatePresence, m } from 'motion/react'
import type { CSSProperties } from 'react'
import { useAppMotion } from '@/components/MotionProvider'
import { useChangeSignal } from '@/hooks/use-micro-feedback'
import { notificationParameters } from '@/lib/motion-recipes'
import { AnimatedNumber } from './animated-number'
export function NotificationIndicator({ count, soundContext = null, soundEnabled = false }: { count: number; soundContext?: AudioContext | null; soundEnabled?: boolean }) {
  const { effectiveIntensity } = useAppMotion()
  const revision = useChangeSignal(count)
  useNotificationSound(revision, soundContext, soundEnabled)
  const n = notificationParameters(effectiveIntensity)
  const time = (ms: number) => n.reduced ? 0 : ms / 1000
  const exit = { duration: time(n.close.duration), ease: [...n.close.ease] as [number, number, number, number] }
  return <span className="notification-indicator" style={n.css as CSSProperties} aria-hidden="true">
    <span key={revision} className="notification-bell" data-pulse={revision > 0}><img src={`${import.meta.env.BASE_URL}assets/figma/bell03-lined.svg`} alt="" className="design-icon" /></span>
    <AnimatePresence initial={false}>{count > 0 ? <m.span key="badge" className="notification-badge-position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: exit }} transition={{ duration: time(n.pop.fade), ease: [...n.pop.ease], opacity: { duration: time(n.pop.fade) } }}>
      <m.span className="notification-badge-slide" initial={{ x: n.slide.x * n.amplitude, y: n.slide.y * n.amplitude }} animate={{ x: 0, y: 0 }} exit={{ x: 0, y: 0, transition: exit }} transition={{ duration: time(n.slide.duration), ease: [...n.slide.ease] }}>
        <m.span className="notification-trigger-dot notification-trigger-count" initial={{ scale: n.reduced ? 1 : 0, filter: `blur(${n.reduced ? 0 : n.pop.blur}px)` }} animate={{ scale: 1, filter: 'blur(0px)' }} exit={{ scale: n.reduced ? 1 : 0, filter: `blur(${n.reduced ? 0 : n.pop.blur}px)`, transition: exit }} transition={{ duration: time(n.pop.duration), ease: [...n.pop.ease] }}>
          <AnimatedNumber value={count} variant="notification" animateInitial={revision > 0} />
        </m.span>
      </m.span>
    </m.span> : null}</AnimatePresence>
  </span>
}
