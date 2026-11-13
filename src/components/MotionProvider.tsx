import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { domMax, LazyMotion, MotionConfig, type Transition } from 'motion/react'
import { useSettings } from '@/components/SettingsProvider'
import type { MotionIntensity } from '@/lib/settings-storage'
import { motionCSSProperties, motionTransition } from '@/lib/motion-tokens'

type MotionContextValue = {
  selectedIntensity: MotionIntensity
  effectiveIntensity: MotionIntensity
  systemReduced: boolean
  spatialMotion: boolean
  transition: Transition
}

const MotionContext = createContext<MotionContextValue | null>(null)

export function AppMotionProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setSystemReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const reduced = settings.respectReducedMotion && systemReduced
  const effectiveIntensity = reduced ? 'minimal' : settings.motionIntensity
  const transition = useMemo(() => motionTransition(effectiveIntensity), [effectiveIntensity])
  const value = useMemo<MotionContextValue>(() => ({
    selectedIntensity: settings.motionIntensity,
    effectiveIntensity,
    systemReduced,
    spatialMotion: effectiveIntensity !== 'minimal',
    transition,
  }), [effectiveIntensity, settings.motionIntensity, systemReduced, transition])

  useLayoutEffect(() => {
    const root = document.documentElement
    for (const [name, value] of Object.entries(motionCSSProperties(effectiveIntensity))) root.style.setProperty(name, value)
    root.dataset.motionLevel = effectiveIntensity
    root.dataset.motionReduced = reduced ? 'true' : 'false'
  }, [effectiveIntensity, reduced])

  return <MotionContext.Provider value={value}>
    <MotionConfig reducedMotion={effectiveIntensity === 'minimal' ? 'always' : settings.respectReducedMotion ? 'user' : 'never'} transition={transition}>
      <LazyMotion features={domMax} strict>{children}</LazyMotion>
    </MotionConfig>
  </MotionContext.Provider>
}

export function useAppMotion() {
  const value = useContext(MotionContext)
  if (!value) throw new Error('AppMotionProvider is required')
  return value
}
