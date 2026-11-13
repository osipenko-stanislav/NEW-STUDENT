import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { MotionConfig, type Transition } from 'motion/react'
import { useSettings } from '@/components/SettingsProvider'
import type { MotionIntensity } from '@/lib/settings-storage'

type MotionContextValue = {
  selectedIntensity: MotionIntensity
  effectiveIntensity: MotionIntensity
  systemReduced: boolean
  spatialMotion: boolean
  transition: Transition
}

const transitions: Record<MotionIntensity, Transition> = {
  minimal: { duration: 0.08, ease: [0.16, 1, 0.3, 1] },
  balanced: { type: 'spring', stiffness: 430, damping: 34, mass: 0.75 },
  expressive: { type: 'spring', stiffness: 360, damping: 28, mass: 0.8 },
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
  const value = useMemo<MotionContextValue>(() => ({
    selectedIntensity: settings.motionIntensity,
    effectiveIntensity,
    systemReduced,
    spatialMotion: effectiveIntensity !== 'minimal',
    transition: transitions[effectiveIntensity],
  }), [effectiveIntensity, settings.motionIntensity, systemReduced])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.motionLevel = effectiveIntensity
    root.dataset.motionReduced = reduced ? 'true' : 'false'
  }, [effectiveIntensity, reduced])

  return <MotionContext.Provider value={value}>
    <MotionConfig reducedMotion={effectiveIntensity === 'minimal' ? 'always' : settings.respectReducedMotion ? 'user' : 'never'} transition={transitions[effectiveIntensity]}>
      {children}
    </MotionConfig>
  </MotionContext.Provider>
}

export function useAppMotion() {
  const value = useContext(MotionContext)
  if (!value) throw new Error('AppMotionProvider is required')
  return value
}
