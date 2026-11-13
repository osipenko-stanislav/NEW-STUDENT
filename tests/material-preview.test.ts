import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveMaterialPreview } from '../src/lib/material-preview.ts'

test('previews supported browser formats using their normalized MIME type', () => {
  for (const [type, kind] of Object.entries({
    'APPLICATION/PDF': 'pdf', 'image/png': 'image', 'image/jpeg': 'image',
    'text/plain; charset=utf-8': 'text', 'text/markdown': 'text', 'text/csv': 'text', 'application/json': 'text',
    'video/mp4': 'video', 'video/webm': 'video', 'audio/mpeg': 'audio', 'audio/wav': 'audio',
  })) assert.equal(resolveMaterialPreview({ name: 'Материал', type })?.kind, kind)
  assert.equal(resolveMaterialPreview({ name: 'README.md', type: 'text/markdown' })?.mime, 'text/plain')
})

test('uses extensions for missing or generic MIME types without overriding specific types', () => {
  assert.deepEqual(resolveMaterialPreview({ name: 'Лекция.PDF', type: '' }), { kind: 'pdf', mime: 'application/pdf' })
  assert.deepEqual(resolveMaterialPreview({ name: 'README.md', type: 'application/octet-stream' }), { kind: 'text', mime: 'text/plain' })
  assert.equal(resolveMaterialPreview({ name: 'Запись.mp3', type: '' })?.kind, 'audio')
  assert.equal(resolveMaterialPreview({ name: 'Материал.pdf', type: 'text/html' }), null)
})

test('does not embed active documents, office formats or unknown data', () => {
  for (const [name, type] of [
    ['Страница.html', 'text/html'], ['Схема.svg', 'image/svg+xml'], ['Скрипт.js', 'text/javascript'],
    ['Работа.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['Таблица.xlsx', ''], ['Архив.zip', 'application/zip'], ['Без расширения', ''],
  ]) assert.equal(resolveMaterialPreview({ name, type }), null)
})
