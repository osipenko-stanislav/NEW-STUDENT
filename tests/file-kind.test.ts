import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileKind } from '../src/lib/file-kind.ts'

test('recognizes the supported file families from case-insensitive extensions', () => {
  for (const [extension, expected] of Object.entries({
    PDF: 'pdf', doc: 'document', docx: 'document', xls: 'spreadsheet', xlsx: 'spreadsheet',
    ppt: 'presentation', pptx: 'presentation', md: 'markdown', txt: 'text',
    png: 'image', JPG: 'image', mp4: 'video', mov: 'video', mp3: 'audio', wav: 'audio', ipynb: 'code',
  })) assert.equal(fileKind({ name: `Учебный материал.${extension}` }), expected)
})

test('uses specific MIME types even without a filename extension', () => {
  for (const [type, expected] of Object.entries({
    'APPLICATION/PDF': 'pdf', 'application/msword': 'document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
    'application/vnd.ms-powerpoint': 'presentation', 'text/markdown; charset=utf-8': 'markdown',
    'text/plain': 'text', 'image/heic': 'image', 'video/webm': 'video', 'audio/ogg': 'audio',
    'application/x-ipynb+json': 'code',
  })) assert.equal(fileKind({ name: 'Без расширения', type }), expected)
})

test('falls back to extensions for generic browser MIME types without confusing missing types', () => {
  assert.equal(fileKind({ name: 'README.md', type: 'text/plain' }), 'markdown')
  assert.equal(fileKind({ name: 'Задачи.ipynb', type: 'application/octet-stream' }), 'code')
  assert.equal(fileKind({ name: 'Конспект.pdf', type: '' }), 'pdf')
  assert.equal(fileKind({ name: 'Файл', type: '' }), 'unknown')
  assert.equal(fileKind({ name: 'Архив.zip', type: 'application/zip' }), 'unknown')
  assert.equal(fileKind({ name: 'Данные.txt', type: 'application/pdf' }), 'pdf')
})
