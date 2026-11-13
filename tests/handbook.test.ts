import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'

type Page = { id: string; parentId: string | null; title: string }
type Node = { type: string; text?: string; attrs?: Record<string, unknown>; content?: Node[] }
const pages: Page[] = JSON.parse(readFileSync(new URL('../src/data/handbook-manifest.json', import.meta.url), 'utf8'))
const root = 'db3f475e-b70a-4423-abc0-b030db55c80b'
const ids = new Set(pages.map(p => p.id))
const doc = (id: string): Node => JSON.parse(readFileSync(new URL(`../public/handbook/${id}.json`, import.meta.url), 'utf8'))
const text = (node: Node): string => node.text ?? (node.content ?? []).map(text).join('')
function collect(node: Node, type: string): Node[] { return [...(node.type === type ? [node] : []), ...(node.content ?? []).flatMap(c => collect(c, type))] }

test('every wiki page has one acyclic path to the root and a corresponding local document', () => {
  assert.equal(ids.size, pages.length)
  assert.equal(pages.filter(p => !p.parentId).length, 1)
  for (const page of pages) {
    const visited = new Set<string>()
    let current: Page | undefined = page
    while (current) {
      assert.ok(!visited.has(current.id), `Cycle in ${page.title}`)
      visited.add(current.id)
      if (!current.parentId) break
      assert.ok(ids.has(current.parentId), `Missing parent for ${page.title}`)
      current = pages.find(p => p.id === current!.parentId)
    }
    assert.equal(current?.id, root)
    assert.equal(doc(page.id).type, 'doc')
  }
  const exported = readdirSync(new URL('../public/handbook', import.meta.url)).filter(name => /^[a-f0-9-]{36}\.json$/.test(name))
  assert.equal(exported.length, pages.length, 'No stale pages for excluded roles')
})

test('explicit senior and other-school pages are absent while first-year learning paths remain', () => {
  for (const id of ['b1173e02-ceee-493a-a6af-aa378f7a26f8', '103c35e5-3965-4a02-9f3f-14873049975f', '04133ba4-1343-4c46-ab8f-b43ff033b3f7', '6c9518bb-49d1-492b-a799-ff157abe8ee6', 'c967ad11-f62c-4ebf-937b-bafe787593b9']) assert.ok(!ids.has(id))
  for (const id of ['69981d7a-7e34-4d9b-9b61-c7218a85bf34', 'd243c829-0a9f-4ec9-824a-1704df93ef17', '482cce55-4ccc-410d-9577-77fb8f6e2c33', '8182ae02-122f-4f80-84f7-9e9614991411']) assert.ok(ids.has(id))
})

test('schedule retains the first-year control-work branch and excludes later cohorts', () => {
  const schedule = doc('5345c471-4b0c-4dbe-87b1-dd9dab3ab846')
  assert.deepEqual(collect(schedule, 'expandTitle').map(text), ['1 курс (1 семестр)'])
  assert.ok(collect(schedule, 'table').length >= 1)
  assert.ok(collect(schedule, 'media').length >= 2, 'Semester calendars remain available as source images')
  const attendance = text(doc('44cbb834-cc76-4aff-b628-842c54f71d25'))
  assert.match(attendance, /75%/)
  assert.doesNotMatch(attendance, /Школа дизайна|В магистратуре/)
  const deadlines = text(doc('1d6285b2-f461-468f-9ab1-dfc6d0929a79'))
  assert.match(deadlines, /50/)
  assert.doesNotMatch(deadlines, /Магистрантам/)
})

test('search covers every imported article and synchronized instructions are resolved', () => {
  const index: { id: string; text: string }[] = JSON.parse(readFileSync(new URL('../public/handbook/search.json', import.meta.url), 'utf8'))
  assert.deepEqual(new Set(index.map(p => p.id)), ids)
  for (const page of pages) assert.equal(collect(doc(page.id), 'syncedContent').length, 0)
  assert.ok(index.find(p => p.id === '1d6285b2-f461-468f-9ab1-dfc6d0929a79')!.text.includes('Как использовать Late Days'))
})

test('migration preserves actionable rich content: instructions, tabs, forms and attachments', () => {
  const docs = pages.map(p => doc(p.id))
  for (const type of ['expandSection', 'table', 'tabs', 'media', 'remoteIframeContent']) assert.ok(docs.some(d => collect(d, type).length > 0), type)
  for (const d of docs) for (const media of collect(d, 'media')) assert.match(String(media.attrs?.src), /^https?:\/\//)
  const form = collect(doc('8182ae02-122f-4f80-84f7-9e9614991411'), 'remoteIframeContent')
  assert.match(String(form[0].attrs?.src), /waitlist_research_track/)
})
