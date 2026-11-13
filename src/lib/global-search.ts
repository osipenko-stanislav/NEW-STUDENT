import type { SearchCategory, SearchItem } from '@/types/search'

function normalize(value: string): string {
  return value.toLocaleLowerCase('ru').replace(/ё/gu, 'е').replace(/\s+/gu, ' ').trim()
}

export function filterSearchItems(items: readonly SearchItem[], query: string, category: SearchCategory): SearchItem[] {
  const normalized = normalize(query)
  const terms = normalized.split(' ').filter(Boolean)
  return items.filter(item => {
    if (category !== 'all' && item.category !== category) return false
    const text = normalize(`${item.title} ${item.path} ${item.fileType ?? ''} ${item.content ?? ''}`)
    return terms.every(term => text.includes(term))
  }).sort((a, b) => score(a.title, normalized) - score(b.title, normalized))
}

function score(title: string, query: string): number {
  if (!query) return 0
  const normalized = normalize(title)
  if (normalized === query) return 0
  if (normalized.startsWith(query)) return 1
  if (normalized.includes(query)) return 2
  return 3
}

const recentStorageKey = 'student-search-recent:v1'

export function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(recentStorageKey)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null || !('version' in data) || data.version !== 1
      || !('ids' in data) || !Array.isArray(data.ids) || !data.ids.every(id => typeof id === 'string')) return []
    return [...new Set<string>(data.ids)].slice(0, 6)
  } catch {
    return []
  }
}

export function saveRecentSearches(ids: string[]): void {
  try {
    localStorage.setItem(recentStorageKey, JSON.stringify({ version: 1, ids: [...new Set(ids)].slice(0, 6) }))
  } catch {
    // Recent shortcuts are optional; search keeps working without browser storage.
  }
}


export function openGlobalSearch(query = '', category: SearchCategory = 'all') {
  window.dispatchEvent(new CustomEvent('student:search', { detail: { query, category } }))
}
