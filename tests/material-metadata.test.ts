import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { formatMaterialSize, loadMaterialMetadata, materialType, previewMaterialType, saveMaterialMetadata } from '../src/lib/material-metadata.ts'

const key = 'student-materials:v1'
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
const material = { id: 'file', originId: 'conversation', name: 'Заметки.txt', type: 'text/plain', size: 0, addedAt: 1 }

test('opening an empty library allocates a draft without persisting an empty conversation', () => {
  const state = loadMaterialMetadata()
  assert.match(state.draftId, /^draft:/)
  assert.deepEqual(state.materials, [])
  assert.equal(state.error, null)
  assert.equal(values.size, 0)
})

test('persists only metadata and restores draft scope and conversation relationships', () => {
  const fileWithContents = { ...material, blob: new Blob(['private bytes']), content: 'private bytes' }
  const materials = [fileWithContents, { ...material, id: 'draft-file', originId: 'draft:saved' }]
  saveMaterialMetadata({ draftId: 'draft:saved', materials, attachments: [{ scopeId: 'another-conversation', materialId: 'file' }] })
  assert.equal(values.get(key)!.includes('private bytes'), false)
  assert.equal(values.get(key)!.includes('blob'), false)
  const restored = loadMaterialMetadata()
  assert.equal(restored.draftId, 'draft:saved')
  assert.deepEqual(restored.materials, [material, { ...material, id: 'draft-file', originId: 'draft:saved' }])
})

test('rejects malformed metadata and invalid dates without silently overwriting storage', () => {
  for (const materials of [[{ ...material, size: -1 }], [{ ...material, addedAt: 1e20 }], [material, material]]) {
    const raw = JSON.stringify({ version: 2, attachments: [], draftId: 'draft:saved', materials })
    values.set(key, raw)
    assert.ok(loadMaterialMetadata().error)
    assert.deepEqual(loadMaterialMetadata().materials, [])
    assert.equal(values.get(key), raw)
  }
})

test('reports blocked storage instead of claiming a successful write', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new DOMException('Denied', 'SecurityError') } })
  assert.ok(loadMaterialMetadata().error)
  assert.throws(() => saveMaterialMetadata({ draftId: 'draft:saved', materials: [material], attachments: [] }))
})

test('formats zero-byte files and binary sizes and does not preview active document types', () => {
  assert.equal(formatMaterialSize(0), '0 Б')
  assert.equal(formatMaterialSize(1536), '1,5 КБ')
  assert.equal(materialType(material), 'TXT')
  assert.equal(previewMaterialType('text/plain'), 'text/plain')
  assert.equal(previewMaterialType('application/pdf'), 'application/pdf')
  assert.equal(previewMaterialType('text/html'), null)
  assert.equal(previewMaterialType('image/svg+xml'), null)
})


test('migrates legacy ownership to upload provenance without replacing file IDs', () => {
  const { originId, ...fields } = material
  const legacy = { ...fields, ownerId: originId }
  values.set(key, JSON.stringify({ version: 1, draftId: 'draft:saved', materials: [legacy] }))
  const restored = loadMaterialMetadata()
  assert.equal(restored.error, null)
  assert.deepEqual(restored.materials, [material])
  assert.deepEqual(restored.attachments, [{ scopeId: originId, materialId: material.id }])
  saveMaterialMetadata(restored)
  const upgraded = JSON.parse(values.get(key)!)
  assert.equal(upgraded.version, 2)
  assert.equal(upgraded.materials[0].id, legacy.id)
  assert.equal(upgraded.materials[0].originId, originId)
  assert.equal(upgraded.materials[0].ownerId, undefined)
  assert.deepEqual(loadMaterialMetadata(), restored)
})

test('deduplicates selections per conversation and drops references to absent files', () => {
  values.set(key, JSON.stringify({ version: 2, draftId: 'draft:saved', materials: [material], attachments: [
    { scopeId: 'first', materialId: material.id }, { scopeId: 'first', materialId: material.id },
    { scopeId: 'second', materialId: material.id }, { scopeId: 'first', materialId: 'absent' },
  ] }))
  assert.deepEqual(loadMaterialMetadata().attachments, [
    { scopeId: 'first', materialId: material.id }, { scopeId: 'second', materialId: material.id },
  ])
})
