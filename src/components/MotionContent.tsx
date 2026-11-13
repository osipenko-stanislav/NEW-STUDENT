import { AnimatePresence, m } from 'motion/react'
import { useAppMotion } from '@/components/MotionProvider'
import type { ReactNode } from 'react';

export function MotionPage({ motionKey, children }: { motionKey: string; children: ReactNode }) {
  const { spatialMotion, transition } = useAppMotion()
  return <AnimatePresence initial={false} mode="popLayout">
    <m.div key={motionKey} className="motion-page"
      initial={spatialMotion ? { opacity: 0.78, y: 5 } : { opacity: 0.94 }}
      animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={transition}>
      {children}
    </m.div>
  </AnimatePresence>
}
