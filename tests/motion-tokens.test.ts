import assert from 'node:assert/strict'
import { test } from 'node:test'
import { motionCSSProperties, motionTransition } from '../src/lib/motion-tokens.ts'

test('CSS and Motion use the same durations and easing for every intensity', () => {
  for (const intensity of ['minimal', 'balanced', 'expressive'] as const) {
    const css = motionCSSProperties(intensity)
    const transition = motionTransition(intensity)
    const seconds = intensity === 'minimal' ? transition.duration : transition.opacity!.duration
    const cssKey = intensity === 'minimal' ? '--motion-fast' : '--motion-base'
    assert.equal(seconds! * 1000, parseFloat(css[cssKey]))
    assert.equal(css['--ease-enter'], 'cubic-bezier(0.25, 0.1, 0.25, 1)')
    assert.equal(css['--motion-scale'], '1.5')
  }
})

test('minimal motion remains shorter, with expressive motion at the longest duration', () => {
  const minimal = motionCSSProperties('minimal')
  const balanced = motionCSSProperties('balanced')
  const expressive = motionCSSProperties('expressive')
  for (const name of ['--motion-fast', '--motion-base', '--motion-slow']) {
    assert(parseFloat(minimal[name]) < parseFloat(balanced[name]))
    assert(parseFloat(balanced[name]) < parseFloat(expressive[name]))
  }
  assert.equal(motionTransition('minimal').duration, 0.12)
})
