import manifest from './handbook-manifest.json'

export type HandbookNode = {
  type: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: { type: string; attrs?: { href?: string } }[]
  content?: HandbookNode[]
}
export const handbookRootId = 'db3f475e-b70a-4423-abc0-b030db55c80b'
const handbookPages = manifest
export const handbookById = new Map(handbookPages.map(page => [page.id, page]))
type HandbookPage = (typeof handbookPages)[number]
const handbookAliases: Record<string, string> = {
  '9fc10273-942d-4172-8dfc-21b559f4bb52': 'd455d7d6-de8a-44b8-a77d-88d13827edf9',
}
export function handbookChildren(id: string) { return handbookPages.filter(page => page.parentId === id) }
export function handbookAncestors(id: string) {
  const result: HandbookPage[] = []
  const visited = new Set<string>()
  let page = handbookById.get(id)
  while (page && !visited.has(page.id)) {
    visited.add(page.id)
    result.unshift(page)
    page = page.parentId ? handbookById.get(page.parentId) : undefined
  }
  return result
}
export function handbookText(node: HandbookNode): string {
  return node.text ?? (node.content ?? []).map(handbookText).join('')
}
export function handbookHeadings(node: HandbookNode): { id: string; title: string; level: number }[] {
  const headings: { id: string; title: string; level: number }[] = []
  const seen = new Set<string>()
  function visit(n: HandbookNode) {
    const title = handbookText(n).trim(), id = String(n.attrs?.id ?? '')
    if (n.type === 'heading' && title && id && !seen.has(id)) {
      seen.add(id)
      headings.push({ id, title, level: Number(n.attrs?.level ?? 2) })
    }
    // Hidden tab contents and collapsed FAQ headings are not in the page outline.
    if (n.type !== 'tabs' && n.type !== 'expandSection') n.content?.forEach(visit)
  }
  visit(node)
  return headings
}
export function handbookHref(id: string, anchor?: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('handbook', id)
  url.hash = anchor ?? ''
  return `${url.pathname}${url.search}${url.hash}`
}
export function handbookLinkTarget(href: string) {
  try {
    const url = new URL(href, 'https://note.cu.ru')
    if (url.hostname !== 'note.cu.ru') return null
    const match = url.pathname.match(/\/(?:at|article)\/([\da-f-]{36})/i)
    if (!match) return null
    const id = handbookAliases[match[1]] ?? match[1]
    return handbookById.has(id) ? { id, anchor: decodeURIComponent(url.hash.slice(1)) } : null
  } catch { return null }
}
export function safeHandbookUrl(href: string) {
  try {
    const url = new URL(href, 'https://note.cu.ru')
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : undefined
  } catch { return undefined }
}
