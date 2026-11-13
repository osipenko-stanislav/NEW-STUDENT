import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { filterSearchItems, loadRecentSearches, saveRecentSearches } from '../src/lib/global-search.ts'
import type { SearchItem } from '../src/types/search.ts'

const items: SearchItem[] = [
  { id: 'material', title: 'Матрицы и определители', path: 'Обучение / Курсы / Линейная алгебра',
    category: 'materials', section: 'Курсы', icon: 'file.svg' },
  { id: 'course', title: 'Линейная алгебра', path: 'Обучение / Курсы',
    category: 'courses', section: 'Курсы', icon: 'book.svg' },
  { id: 'record', title: 'Зачетка', path: 'Обучение', category: 'sections', section: 'Зачетка', icon: 'book.svg' },
  { id: 'homework', title: 'Функции', path: 'Обучение / Домашки / Программирование на Python',
    category: 'homework', section: 'Домашки', icon: 'file.svg' },
]

test('matches both object titles and paths with all query terms', () => {
  assert.deepEqual(filterSearchItems(items, 'обучение матрицы', 'all').map(item => item.id), ['material'])
  assert.deepEqual(filterSearchItems(items, 'алгебра', 'all').map(item => item.id), ['course', 'material'])
  assert.deepEqual(filterSearchItems(items, 'алгебра неизвестно', 'all'), [])
})

test('normalizes case, whitespace, and Russian yo without changing display content', () => {
  assert.equal(filterSearchItems(items, '  НА\tPYTHON  ', 'all')[0].title, 'Функции')
  assert.equal(filterSearchItems(items, 'зачётка', 'all')[0].title, 'Зачетка')
})

test('applies category filters to empty and nonempty queries', () => {
  assert.deepEqual(filterSearchItems(items, '', 'materials').map(item => item.id), ['material'])
  assert.deepEqual(filterSearchItems(items, 'алгебра', 'courses').map(item => item.id), ['course'])
  assert.deepEqual(filterSearchItems(items, 'алгебра', 'sections'), [])
})

test('prioritizes title matches and keeps the input array intact', () => {
  const original = items.map(item => item.id)
  assert.equal(filterSearchItems(items, 'Линейная алгебра', 'all')[0].id, 'course')
  assert.deepEqual(filterSearchItems(items, '  ', 'all'), items)
  assert.deepEqual(items.map(item => item.id), original)
})

let values: Map<string, string>
let originalStorage: PropertyDescriptor | undefined
beforeEach(() => {
  values = new Map()
  originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) } },
  })
})
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else Reflect.deleteProperty(globalThis, 'localStorage')
})

test('does not write recents on first open and restores them after a fresh read', () => {
  assert.deepEqual(loadRecentSearches(), [])
  assert.equal(values.size, 0)
  saveRecentSearches(['schedule', 'courses'])
  assert.deepEqual(loadRecentSearches(), ['schedule', 'courses'])
})

test('keeps up to six distinct recent destinations in the supplied activity order', () => {
  saveRecentSearches(['a', 'b', 'a', 'c', 'd', 'e', 'f', 'g'])
  assert.deepEqual(loadRecentSearches(), ['a', 'b', 'c', 'd', 'e', 'f'])
})

test('ignores invalid recent storage', () => {
  for (const raw of ['bad json', 'null', '{"version":2,"ids":[]}', '{"version":1,"ids":[1]}']) {
    values.set('student-search-recent:v1', raw)
    assert.deepEqual(loadRecentSearches(), [])
  }
})

test('search remains available when browser storage is blocked', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true, get() { throw new Error('Storage unavailable') },
  })
  assert.deepEqual(loadRecentSearches(), [])
  assert.doesNotThrow(() => saveRecentSearches(['schedule']))
  assert.equal(filterSearchItems(items, 'зачетка', 'all').length, 1)
})


test('finds handbook body text and material formats', () => {
  const documents: SearchItem[] = [
    { ...items[0], fileType: 'PDF' },
    { ...items[1], id: 'wiki', category: 'handbook', content: 'Оформи академический отпуск' },
  ]
  assert.equal(filterSearchItems(documents, 'pdf', 'materials')[0]?.id, 'material')
  assert.equal(filterSearchItems(documents, 'академический отпуск', 'handbook')[0]?.id, 'wiki')
})
