import type { ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { useAppMotion } from '@/components/MotionProvider'
import { recipeTransition } from '@/lib/motion-recipes'
export function StateIcon({ state, revision = 0, children }: { state: string; revision?: number; children: ReactNode }) {
  const { effectiveIntensity, spatialMotion } = useAppMotion()
  return <span className="state-icon" aria-hidden="true" data-icon-state={state}><AnimatePresence initial={false} mode="sync"><m.span key={`${state}:${revision}`} className="state-icon-layer" initial={{ opacity: 0, scale: spatialMotion ? (state === 'pinned' ? .94 : .8) : 1, rotate: spatialMotion && state !== 'pinned' && state !== 'empty' ? -8 : 0 }} animate={{ opacity: 1, scale: spatialMotion && state === 'pinned' ? [.94, 1.08, 1] : 1, rotate: 0 }} exit={{ opacity: 0, scale: spatialMotion ? .85 : 1, transition: recipeTransition(state === 'pinned' || state === 'empty' ? 'pin' : 'iconSwap', effectiveIntensity, true) }} transition={recipeTransition(state === 'pinned' || state === 'empty' ? 'pin' : 'iconSwap', effectiveIntensity)}>{children}</m.span></AnimatePresence></span>
}
