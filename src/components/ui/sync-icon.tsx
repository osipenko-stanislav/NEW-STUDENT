import { useEffect } from 'react'
import { animate, m, useMotionValue } from 'motion/react'
import { RefreshCw } from 'lucide-react'
import { useAppMotion } from '@/components/MotionProvider'
import { motionRecipes, recipe, recipeTransition } from '@/lib/motion-recipes'
export function SyncIcon({ active }: { active: boolean }) {
  const { effectiveIntensity, spatialMotion } = useAppMotion()
  const rotate = useMotionValue(0)
  useEffect(() => {
    if (!spatialMotion) { rotate.set(0); return }
    const current = rotate.get()
    let cancelled = false
    let controls: ReturnType<typeof animate> | undefined
    if (active) {
      // Accelerate once; subsequent revolutions are seamless constant-speed loops.
      controls = animate(rotate, current + 33, { duration: motionRecipes.sync.acceleration / 1000, ease: [.4, 0, 1, 1], onComplete: () => {
        if (!cancelled) controls = animate(rotate, rotate.get() + 360, { duration: recipe('sync', effectiveIntensity).duration / 1000, ease: 'linear', repeat: Infinity })
      } })
    } else if (current % 360 !== 0) {
      controls = animate(rotate, Math.ceil(current / 360) * 360, recipeTransition('sync', effectiveIntensity, true))
    }
    return () => { cancelled = true; controls?.stop() }
  }, [active, effectiveIntensity, spatialMotion, rotate])
  return <m.span className="sync-rotor" data-sync-active={active} style={{ rotate }}><RefreshCw aria-hidden="true" /></m.span>
}
