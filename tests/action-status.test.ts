import assert from 'node:assert/strict'
import test from 'node:test'
import { createActionStatusStore } from '../src/lib/action-status.ts'

test('concurrent operations retain their identities and independent outcomes', () => {
  const store = createActionStatusStore(() => 100)
  const upload = store.begin({ label: 'Загрузка' })
  const sync = store.begin({ label: 'Синхронизация', progress: 0 })
  store.update(sync, { progress: .65 })
  store.finish(upload, 'Файл сохранён')
  assert.deepEqual([upload, sync].map(id => { const task = store.getSnapshot().find(task => task.id === id)!; return [task.id, task.status, task.progress] }), [[upload, 'success', undefined], [sync, 'running', .65]])
  store.finish(sync, 'Нет подключения', false)
  assert.equal(store.getSnapshot().find(task => task.id === sync)!.status, 'error')
  assert.equal(store.getSnapshot().find(task => task.id === sync)!.progress, undefined)
})
test('rapid settings updates coalesce and an old expiry cannot erase a new outcome', () => {
  const store = createActionStatusStore()
  const id = store.report({ key: 'settings', label: 'Сохранено' })
  const revision = store.getSnapshot()[0].revision
  assert.equal(store.report({ key: 'settings', label: 'Не сохранено' }, false), id)
  store.dismiss(id, revision)
  assert.equal(store.getSnapshot().length, 1)
  assert.equal(store.getSnapshot()[0].status, 'error')
  store.dismiss(id)
  assert.equal(store.getSnapshot().length, 0)
})
test('running work cannot be dismissed and late completion after reset is ignored', () => {
  const store = createActionStatusStore()
  const id = store.begin({ label: 'Сохранение' })
  store.dismiss(id)
  assert.equal(store.getSnapshot().length, 1)
  store.clear()
  store.finish(id, 'Сохранено')
  assert.deepEqual(store.getSnapshot(), [])
})
test('success retention stays bounded without losing running work or errors', () => {
  const store = createActionStatusStore()
  const running = store.begin({ label: 'Работа' })
  const error = store.report({ label: 'Ошибка' }, false)
  for (let i = 0; i < 20; i++) store.report({ label: `Сохранение ${i}` })
  assert.equal(store.getSnapshot().filter(task => task.status === 'success').length, 6)
  assert.ok(store.getSnapshot().some(task => task.id === running))
  assert.ok(store.getSnapshot().some(task => task.id === error))
})
test('store snapshots stay referentially stable between actual events and unsubscribe works', () => {
  const store = createActionStatusStore()
  assert.equal(store.getSnapshot(), store.getSnapshot())
  let calls = 0
  const unsubscribe = store.subscribe(() => calls++)
  store.report({ label: 'Сохранено' })
  assert.equal(calls, 1)
  unsubscribe()
  store.clear()
  assert.equal(calls, 1)
})
