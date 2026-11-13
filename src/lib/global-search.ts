import type { SearchCategory, SearchItem } from '@/types/search'

function normalize(value: string): string {
  return value.toLocaleLowerCase('ru').replace(/ё/gu, 'е').replace(/\s+/gu, ' ').trim()
}

export function createSearchIndex(items: readonly SearchItem[]) {
  return items.map(item => ({ item, title: normalize(item.title), text: normalize(`${item.title} ${item.path} ${item.fileType ?? ''} ${item.content ?? ''}`) }))
}

export function searchIndex(index: ReturnType<typeof createSearchIndex>, query: string, category: SearchCategory): SearchItem[] {
  const normalized = normalize(query)
  const terms = normalized.split(' ').filter(Boolean)
  return index.filter(({ item, text }) => (category === 'all' || item.category === category) && terms.every(term => text.includes(term)))
    .map(entry => ({ item: entry.item, score: score(entry.title, normalized) }))
    .sort((a, b) => a.score - b.score).map(entry => entry.item)
}

export function filterSearchItems(items: readonly SearchItem[], query: string, category: SearchCategory): SearchItem[] {
  return searchIndex(createSearchIndex(items), query, category)
}

function score(normalized: string, query: string): number {
  if (!query) return 0
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
