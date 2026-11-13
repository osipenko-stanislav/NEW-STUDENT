import type { MotionIntensity } from './settings-storage'
import type { Transition } from 'motion/react'
// Distinct contracts, not a global time multiplier. Values are milliseconds/pixels.
export const motionRecipes = {
  bellPress: { duration: 150, exit: 150, distance: 0, ease: [.22, 1, .36, 1] },
  radio: { duration: 160, exit: 120, distance: 0, ease: [.22, 1, .36, 1] },
  actionSpin: { duration: 800, exit: 120, distance: 0, ease: [0, 0, 1, 1] },
  sync: { acceleration: 220, duration: 1200, exit: 220, distance: 0, ease: [.22, 1, .36, 1] },
  iconSwap: { duration: 160, exit: 120, distance: 3, ease: [.22, 1, .36, 1] },
  check: { duration: 180, exit: 120, distance: 0, ease: [.16, 1, .3, 1] },
  tabs: { duration: 180, exit: 120, distance: 0, ease: [.4, 0, .2, 1] },
  disclosure: { duration: 220, exit: 180, distance: 0, ease: [.25, .1, .25, 1] },
  pin: { duration: 180, exit: 120, distance: 0, ease: [.34, 1.25, .64, 1] },
  status: { duration: 180, exit: 120, distance: 2, ease: [.22, 1, .36, 1] },
  counter: { duration: 220, exit: 140, distance: 2, ease: [.22, 1, .36, 1] },
  field: { duration: 120, exit: 80, distance: 0, ease: [.2, 0, 0, 1] },
  file: { duration: 180, exit: 140, distance: 4, ease: [.16, 1, .3, 1] },
  action: { duration: 160, exit: 120, distance: 2, ease: [.22, 1, .36, 1] },
  progress: { duration: 180, exit: 120, distance: 0, ease: [.4, 0, .2, 1] },
  calendar: { duration: 180, exit: 120, distance: 6, ease: [.22, 1, .36, 1] },
  menu: { duration: 160, exit: 120, distance: 2, ease: [.16, 1, .3, 1] },
  tooltip: { duration: 120, exit: 80, distance: 2, ease: [.22, 1, .36, 1] },
} as const
export type MotionRecipe = keyof typeof motionRecipes
export function recipe(name: MotionRecipe, intensity: MotionIntensity) {
  const base = motionRecipes[name]
  return { ...base, duration: intensity === 'minimal' ? 0 : base.duration, exit: intensity === 'minimal' ? 0 : base.exit, distance: intensity === 'minimal' ? 0 : base.distance * (intensity === 'expressive' ? 1.25 : 1) }
}
export function recipeTransition(name: MotionRecipe, intensity: MotionIntensity, exit = false): Transition {
  const value = recipe(name, intensity)
  return { duration: (exit ? value.exit : value.duration) / 1000, ease: [...value.ease] as [number, number, number, number] }
}
export function recipeCSSProperties(intensity: MotionIntensity) {
  return Object.fromEntries(Object.entries(motionRecipes).flatMap(([name]) => {
    const value = recipe(name as MotionRecipe, intensity)
    return [[`--motion-${name}`, `${value.duration}ms`], [`--motion-${name}-exit`, `${value.exit}ms`], [`--ease-${name}`, `cubic-bezier(${value.ease.join(',')})`]]
  }))
}
export const notificationRecipe = {
  press: { duration: 150, scale: .97, ease: [.22, 1, .36, 1] },
  ring: { duration: 900, angle: 18, ease: [.36, .07, .19, .97] },
  slide: { duration: 260, x: -8.2, y: 12.4, ease: [.22, 1, .36, 1] },
  pop: { duration: 500, fade: 400, blur: 2, ease: [.34, 1.36, .64, 1] },
  close: { duration: 180, ease: [.4, 0, .2, 1] },
  digits: { duration: 500, distance: 8, blur: 2, stagger: 70, ease: [.34, 1.45, .64, 1] },
} as const
export function notificationParameters(intensity: MotionIntensity) {
  const reduced = intensity === 'minimal'
  return { ...notificationRecipe, reduced, amplitude: reduced ? 0 : intensity === 'expressive' ? 1.12 : 1,
    css: { '--notification-ring-duration': `${reduced ? 0 : notificationRecipe.ring.duration}ms`, '--notification-ring-angle': `${reduced ? 0 : notificationRecipe.ring.angle * (intensity === 'expressive' ? 1.12 : 1)}deg`, '--notification-ring-ease': `cubic-bezier(${notificationRecipe.ring.ease.join(',')})` } }
}
