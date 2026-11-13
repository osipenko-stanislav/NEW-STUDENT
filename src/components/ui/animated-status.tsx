import { AnimatePresence, m } from 'motion/react'
import type { ReactNode } from 'react'
import { useAppMotion } from '@/components/MotionProvider'
import { recipe, recipeTransition, type MotionRecipe } from '@/lib/motion-recipes'
import { StateIcon } from './state-icon'
export function AnimatedLabel({ value, choices = [value], pattern = 'status' }: { value: string; choices?: string[]; pattern?: MotionRecipe }) {
  const { effectiveIntensity, spatialMotion } = useAppMotion()
  return <span className="animated-label"><span className="sr-only">{value}</span><span className="animated-label-visual" aria-hidden="true"><span className="animated-label-reserve">{[...new Set(choices)].map(text => <span key={text}>{text}</span>)}</span><AnimatePresence initial={false} mode="popLayout"><m.span key={value} className="animated-label-current" initial={{ opacity: 0, y: spatialMotion ? recipe(pattern, effectiveIntensity).distance : 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: recipeTransition(pattern, effectiveIntensity, true) }} transition={recipeTransition(pattern, effectiveIntensity)}>{value}</m.span></AnimatePresence></span></span>
}
export function AnimatedStatus({ state, label, icon, choices }: { state: string; label: string; icon?: ReactNode; choices?: string[] }) {
  return <>{icon ? <StateIcon state={state}>{icon}</StateIcon> : null}<AnimatedLabel value={label} choices={choices} /></>
}
