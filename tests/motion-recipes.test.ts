import assert from 'node:assert/strict'
import { test } from 'node:test'
import { notificationParameters, recipe, recipeTransition } from '../src/lib/motion-recipes.ts'
import { motionCSSProperties } from '../src/lib/motion-tokens.ts'

test('balanced notification preserves the independent Transitions.dev choreography without shell scaling', () => {
  const n = notificationParameters('balanced')
  assert.equal(n.ring.duration, 900)
  assert.equal(n.ring.angle, 18)
  assert.deepEqual(n.ring.ease, [.36, .07, .19, .97])
  assert.deepEqual([n.slide.duration, n.slide.x, n.slide.y], [260, -8.2, 12.4])
  assert.deepEqual([n.pop.duration, n.pop.fade, n.pop.blur, n.close.duration], [500, 400, 2, 180])
  assert.deepEqual([n.digits.duration, n.digits.distance, n.digits.blur, n.digits.stagger], [500, 8, 2, 70])
  assert.deepEqual(n.pop.ease, [.34, 1.36, .64, 1])
  assert.deepEqual(n.digits.ease, [.34, 1.45, .64, 1])
  assert.equal(n.press.scale, .97)
  assert.equal(n.press.duration, 150)
})
test('expressive increases local amplitude without slowing the recipe and reduced is non-spatial', () => {
  const balanced = recipe('calendar', 'balanced')
  const expressive = recipe('calendar', 'expressive')
  assert.equal(expressive.duration, balanced.duration)
  assert(expressive.distance > balanced.distance)
  assert.equal(recipe('calendar', 'minimal').distance, 0)
  assert.equal(recipe('calendar', 'minimal').duration, 0)
  assert.equal(notificationParameters('minimal').amplitude, 0)
  assert.equal(notificationParameters('minimal').css['--notification-ring-duration'], '0ms')
  assert.equal(notificationParameters('expressive').ring.duration, 900)
})
test('CSS and Motion share per-object enter and exit contracts, independently of macro times', () => {
  for (const intensity of ['minimal','balanced','expressive'] as const) {
    const css = motionCSSProperties(intensity)
    for (const name of ['check','counter','calendar','menu','file','status','action'] as const) {
      assert.equal(recipeTransition(name, intensity).duration! * 1000, parseFloat(css[`--motion-${name}`]))
      assert.equal(recipeTransition(name, intensity, true).duration! * 1000, parseFloat(css[`--motion-${name}-exit`]))
    }
  }
  assert.notDeepEqual(recipe('menu', 'balanced').ease, recipe('tabs', 'balanced').ease)
  assert.equal(recipe('file', 'balanced').duration, 180)
})
