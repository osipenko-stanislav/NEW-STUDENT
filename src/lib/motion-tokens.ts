import { recipeCSSProperties } from './motion-recipes.ts'
import type { Transition } from 'motion/react'
import type { MotionIntensity } from './settings-storage'

const motionScale = 1.5
const motionEasing = {
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
    ...recipeCSSProperties(intensity),
    '--motion-scale': String(motionScale),
    '--motion-micro': `${microDuration(intensity)}ms`,
    '--micro-distance': `${microOffset(intensity)}px`,
    '--micro-turn': intensity === 'minimal' ? '0deg' : intensity === 'expressive' ? '14deg' : '8deg',
    '--micro-press-scale': intensity === 'minimal' ? '1' : intensity === 'expressive' ? '.94' : '.96',
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

export const feedbackHold = 900
function microDuration(intensity: MotionIntensity) { return intensity === 'minimal' ? 0 : intensity === 'expressive' ? 180 : 150 }
export function microTransition(intensity: MotionIntensity): Transition {
  return { duration: microDuration(intensity) / 1000, ease: motionEasing.enter }
}
export function microSpring(intensity: MotionIntensity): Transition {
  return intensity === 'minimal' ? { duration: 0 } : { type: 'spring', stiffness: intensity === 'expressive' ? 650 : 700, damping: intensity === 'expressive' ? 29 : 38, mass: .5 }
}

export function microOffset(intensity: MotionIntensity) { return intensity === 'minimal' ? 0 : intensity === 'expressive' ? 3 : 2 }
