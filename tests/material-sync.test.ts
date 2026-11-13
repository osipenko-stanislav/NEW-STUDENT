import assert from 'node:assert/strict'
import { test } from 'node:test'
import { academicMaterials } from '../src/data/academic-data.ts'
import { localMaterialRevision, materialSyncStatus, preparedAcademicFiles } from '../src/lib/material-sync-demo.ts'
import { createMaterialContextResponse } from '../src/lib/material-context-demo.ts'
import type { ConversationMaterial } from '../src/types/material.ts'
const records = (revision: number): ConversationMaterial[] => academicMaterials.map(item => ({ id: `academic:${item.id}`, sourceAcademicId: item.id, academicRevision: revision, originId: 'university', name: item.title, type: 'text/markdown', size: 1, addedAt: 1 }))

test('availability is derived from the complete published version, never elapsed time', () => {
  assert.equal(materialSyncStatus(localMaterialRevision([]), null), 'update')
  assert.equal(materialSyncStatus(localMaterialRevision(records(1)), null), 'update')
  assert.equal(materialSyncStatus(localMaterialRevision(records(2)), null), 'current')
  assert.equal(materialSyncStatus(localMaterialRevision(records(2)), 'offline'), 'error')
  assert.equal(localMaterialRevision(records(2).slice(1)), 0)
})
test('the prepared update changes Markdown while retaining valid PDF bytes', async () => {
  const previous = await preparedAcademicFiles(1)
  const next = await preparedAcademicFiles(2)
  assert.equal(next.length, academicMaterials.length)
  assert.equal(new Set(next.map(item => item.sourceAcademicId)).size, next.length)
  const before = previous.find(item => item.sourceAcademicId === 'validation-guide')!
  const after = next.find(item => item.sourceAcademicId === 'validation-guide')!
  assert.notEqual(await before.blob.text(), await after.blob.text())
  const pdf = next.find(item => item.sourceAcademicId === 'metrics-notes')!
  assert.equal((await pdf.blob.text()).slice(0, 4), '%PDF')
  assert.deepEqual(await previous.find(item => item.sourceAcademicId === pdf.sourceAcademicId)!.blob.arrayBuffer(), await pdf.blob.arrayBuffer())
})
test('prepared answers cite existing document IDs and distinguish personal file availability', () => {
  const draft = { text: 'Кратко объясни материал', command: null }
  const files = records(2).filter(item => item.sourceAcademicId === 'validation-guide')
  const answer = createMaterialContextResponse(draft, files)!
  assert.equal(answer.attachments![0].materialId, files[0].id)
  assert.match(JSON.stringify(answer.content), /проверочн/)
  const privateFile = { ...files[0], id: 'personal', sourceAcademicId: undefined }
  const privateAnswer = createMaterialContextResponse(draft, [privateFile])!
  assert.match(JSON.stringify(privateAnswer.content), /не используется в ответах/)
  assert.equal(privateAnswer.attachments, undefined)
  assert.equal(createMaterialContextResponse({ text: 'Расписание сегодня', command: null }, files), undefined)
})
