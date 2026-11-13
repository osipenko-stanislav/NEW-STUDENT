import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { defaultSettings, loadSettings, normalizeSettings, saveSettings, settingsStorageKey } from '../src/lib/settings-storage.ts'
import { displayDate, displayTime, displayDateTime } from '../src/lib/display-formats.ts'
let values: Map<string, string>
let originalStorage: PropertyDescriptor | undefined
beforeEach(() => {
  values = new Map()
  originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
  } })
})
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else Reflect.deleteProperty(globalThis, 'localStorage')
})
test('defaults do not create storage or share mutable arrays', () => {
  assert.deepEqual(loadSettings(), {settings: defaultSettings, error: null})
  assert.equal(values.size, 0)
  const result = normalizeSettings(null)
  result.hiddenWidgets.push('weather')
  assert.deepEqual(normalizeSettings(null).hiddenWidgets, [])
})
test('validates preferences independently and strips unknown fields', () => {
  assert.deepEqual(normalizeSettings({timeFormat:'12',dateFormat:'junk',spellcheck:false,interfaceAnimations:'false',orbAnimation:'false',hiddenWidgets:['weather','weather'],hiddenSuggestions:[12],password:'secret'}), {...defaultSettings,timeFormat:'12',spellcheck:false,hiddenWidgets:['weather']})
})
test('persists all working preferences across reload', () => {
  const settings=normalizeSettings({timeFormat:'12',dateFormat:'iso',density:'compact',textSize:'large',sendShortcut:'modifier-enter',spellcheck:false,interfaceAnimations:false,orbAnimation:false,historyMode:'hidden',confirmConversationDeletion:false,hiddenSuggestions:['Домашки']})
  saveSettings(settings)
  assert.deepEqual(loadSettings(),{settings,error:null})
})
test('reports corrupt and blocked storage without replacing its contents', () => {
  values.set(settingsStorageKey,'broken')
  assert.ok(loadSettings().error)
  assert.equal(values.get(settingsStorageKey),'broken')
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get:()=>{throw new DOMException('Denied','SecurityError')}})
  assert.ok(loadSettings().error)
  assert.throws(()=>saveSettings(defaultSettings))
})
test('formats dates and times consistently in Moscow independently of device timezone', () => {
  const iso={timeFormat:'24',dateFormat:'iso'} as const
  assert.equal(displayDate('2026-11-11',iso),'2026-11-11')
  assert.equal(displayDate('2026-11-11T22:30:00Z',iso),'2026-11-12')
  assert.equal(displayDate('2026-11-11',{...iso,dateFormat:'numeric'}),'11.11.2026')
  assert.equal(displayTime('18:30',iso),'18:30')
  assert.equal(displayTime('18:30',{...iso,timeFormat:'12'}),'06:30 PM')
  assert.equal(displayDateTime('2026-11-11T22:30:00Z',iso),'2026-11-12, 01:30')
})

test('persists demo repository settings and rejects unsupported synchronization intervals', () => {
  const settings = normalizeSettings({ downloadFolder: '  ~/Documents/LMS  ', downloadAutoSync: false, downloadInterval: 15 })
  saveSettings(settings)
  const restored = loadSettings().settings
  assert.equal(restored.downloadFolder, '~/Documents/LMS')
  assert.equal(restored.downloadAutoSync, false)
  assert.equal(restored.downloadInterval, 15)
  assert.equal(normalizeSettings({ downloadInterval: 1, downloadFolder: { path: '/tmp' } }).downloadInterval, defaultSettings.downloadInterval)
  assert.equal(normalizeSettings({ downloadFolder: { path: '/tmp' } }).downloadFolder, '')
})
