import type { Transition } from 'motion/react'
import type { MotionIntensity } from './settings-storage'

export const motionScale = 1.5
export const motionEasing = {
  enter: [0.25, 0.1, 0.25, 1],
  exit: [0.4, 0, 0.75, 0.9],
  move: [0.4, 0, 0.2, 1],
} as const

const profiles = {
  minimal: { fast: 80, base: 100, slow: 120 },
  balanced: { fast: 120, base: 220, slow: 360 },
  expressive: { fast: 150, base: 250, slow: 420 },
} satisfies Record<MotionIntensity, { fast: number; base: number; slow: number }>

export function motionCSSProperties(intensity: MotionIntensity): Record<string, string> {
  const profile = profiles[intensity]
  return {
    '--motion-scale': String(motionScale),
    '--motion-fast': `${profile.fast * motionScale}ms`,
    '--motion-base': `${profile.base * motionScale}ms`,
    '--motion-slow': `${profile.slow * motionScale}ms`,
    ...Object.fromEntries(Object.entries(motionEasing).map(([name, curve]) => [`--ease-${name}`, `cubic-bezier(${curve.join(', ')})`])),
  }
}

export function motionTransition(intensity: MotionIntensity): Transition {
  if (intensity === 'minimal') return { duration: profiles.minimal.fast * motionScale / 1000, ease: motionEasing.enter }
  const spring = intensity === 'balanced' ? { stiffness: 430, damping: 34, mass: 0.75 } : { stiffness: 360, damping: 28, mass: 0.8 }
  return {
    type: 'spring',
    stiffness: spring.stiffness / motionScale ** 2,
    damping: spring.damping / motionScale,
    mass: spring.mass,
    opacity: { type: 'tween', duration: profiles[intensity].base * motionScale / 1000, ease: motionEasing.enter },
  }
}
