import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, ChevronDown, ChevronRight, FileText, Link, ListTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { navigate, useNavigation } from '@/hooks/use-navigation'
import { handbookAncestors, handbookById, handbookChildren, handbookHeadings, handbookHref, handbookLinkTarget, handbookRootId, type HandbookNode } from '@/data/handbook'
import HandbookArticle from './HandbookArticle'
import '@/handbook.css'
import { m } from 'motion/react'
import { useAppMotion } from '@/components/MotionProvider'

const documents = new Map<string, Promise<HandbookNode>>()
function loadDocument(id: string) {
  let request = documents.get(id)
  if (!request) {
    request = fetch(`${import.meta.env.BASE_URL}handbook/${id}.json`).then(response => {
      if (!response.ok) throw new Error('Article unavailable')
      return response.json() as Promise<HandbookNode>
    }).catch(error => { documents.delete(id); throw error })
    documents.set(id, request)
  }
  return request
}
function Tree({ selectedId, expanded, onToggle, onOpen }: {
  selectedId: string; expanded: Set<string>; onToggle: (id: string) => void; onOpen: (id: string) => void
}) {
  const render = (parentId: string, depth = 0) => <ul>{handbookChildren(parentId).map(page => {
    const hasChildren = handbookChildren(page.id).length > 0
    const open = expanded.has(page.id)
    return <li key={page.id}>
      <div className="handbook-tree-row" data-active={selectedId === page.id} style={{ paddingInlineStart: depth * 14 + 4 }}>
        {hasChildren ? <Button variant="ghost" size="icon" className="handbook-tree-toggle" aria-label={`${open ? 'Свернуть' : 'Развернуть'} раздел «${page.title}»`} aria-expanded={open} onClick={() => onToggle(page.id)}>{open ? <ChevronDown /> : <ChevronRight />}</Button> : <FileText className="handbook-tree-file" aria-hidden="true" />}
        <a href={handbookHref(page.id)} aria-current={selectedId === page.id ? 'page' : undefined} onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
          event.preventDefault(); onOpen(page.id)
        }}>{page.title}</a>
      </div>
      {hasChildren && open ? render(page.id, depth + 1) : null}
    </li>
  })}</ul>
  return <nav aria-label="Страницы хэндбука" className="handbook-tree">
    <a className="handbook-tree-home" href={handbookHref(handbookRootId)} aria-current={selectedId === handbookRootId ? 'page' : undefined} onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault(); onOpen(handbookRootId)
    }}><BookOpen aria-hidden="true" />Главная</a>
    {render(handbookRootId)}
  </nav>
}
export default function HandbookWorkspace() {
  const { spatialMotion, transition } = useAppMotion()
  const state = useNavigation()
  const pageId = state.handbookPageId ?? handbookRootId
  const page = handbookById.get(pageId)
  const [expanded, setExpanded] = useState(() => new Set(handbookAncestors(pageId).map(p => p.id)))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [document, setDocument] = useState<{ id: string; node: HandbookNode } | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [activeHeading, setActiveHeading] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const node = document?.id === pageId ? document.node : null
  const headings = useMemo(() => node ? handbookHeadings(node) : [], [node])
  const childPages = useMemo(() => {
    const linked = new Set<string>()
    function visit(n: HandbookNode) {
      n.marks?.forEach(mark => { const target = mark.attrs?.href ? handbookLinkTarget(mark.attrs.href) : null; if (target) linked.add(target.id) })
      n.content?.forEach(visit)
    }
    if (node) visit(node)
    return handbookChildren(pageId).filter(child => !linked.has(child.id))
  }, [node, pageId])
  function openPage(id: string, anchor?: string) {
    navigate({ section: 'Хэндбук', handbookPageId: id, handbookAnchor: anchor || null })
    setMobileOpen(false)
  }
  function toggle(id: string) { setExpanded(current => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next }) }
  function openAnchor(id: string) {
    navigate({ handbookAnchor: id }, true)
    const target = window.document.getElementById(`hb-${id}`)
    target?.scrollIntoView({ block: 'start' })
    target?.focus({ preventScroll: true })
  }
  useEffect(() => {
    setExpanded(current => new Set([...current, ...handbookAncestors(pageId).map(p => p.id)]))
    setCopied(false); setCopyError(false)
  }, [pageId])
  useEffect(() => {
    if (!page) return
    let cancelled = false
    setError(false)
    loadDocument(pageId).then(node => { if (!cancelled) setDocument({ id: pageId, node }) }).catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [pageId, retry, page])
  useLayoutEffect(() => {
    if (!node) return
    const anchor = state.handbookAnchor
    const target = anchor ? window.document.getElementById(`hb-${anchor}`) : null
    if (target) {
      let parent = target.parentElement
      while (parent) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement }
      target.scrollIntoView({ block: 'start' }); target.focus({ preventScroll: true })
    } else {
      scrollRef.current?.scrollTo({ top: 0 }); titleRef.current?.focus({ preventScroll: true })
    }
  }, [node, pageId, state.handbookAnchor])
  useEffect(() => {
    if (!node || !scrollRef.current) return
    const observer = new IntersectionObserver(entries => {
      const visible = entries.find(entry => entry.isIntersecting)
      if (visible) setActiveHeading(visible.target.id.slice(3))
    }, { root: scrollRef.current, rootMargin: '0px 0px -65% 0px' })
    headings.forEach(h => { const el = window.document.getElementById(`hb-${h.id}`); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [node, headings])
  const tree = <Tree selectedId={pageId} expanded={expanded} onToggle={toggle} onOpen={openPage} />
  async function copyLink() {
    try { await navigator.clipboard.writeText(new URL(handbookHref(pageId, state.handbookAnchor ?? undefined), window.location.origin).href); setCopied(true); setCopyError(false) }
    catch { setCopyError(true) }
  }
  return <section className="handbook-workspace" aria-label="Хэндбук студента">
    <aside className="handbook-sidebar">{tree}</aside>
    <div ref={scrollRef} className="handbook-reading-area">
      {!page ? <div className="handbook-empty"><h1>Страница не найдена</h1><p>Открой нужный раздел в содержании хэндбука.</p><Button variant="outline" onClick={() => openPage(handbookRootId)}>На главную хэндбука</Button></div> : <div className="page-container handbook-document-layout">
        <div className="handbook-toolbar"><Button type="button" variant="outline" className="handbook-mobile-tree" onClick={() => setMobileOpen(true)}><ListTree aria-hidden="true" />Содержание</Button></div>
        <m.article key={pageId} className="handbook-page"
          initial={spatialMotion ? { opacity: 0, y: 6 } : { opacity: 0.94 }} animate={{ opacity: 1, y: 0 }} transition={transition}>
          <header className="handbook-page-header"><h1 ref={titleRef} tabIndex={-1}>{page.title}</h1><Button type="button" variant="ghost" size="icon" aria-label={copied ? 'Ссылка скопирована' : 'Скопировать ссылку на страницу'} onClick={() => void copyLink()}>{copied ? <Check aria-hidden="true" /> : <Link aria-hidden="true" />}</Button></header>
          {copied || copyError ? <div className="handbook-copy-status" role="status">{copyError ? 'Не удалось скопировать ссылку. Скопируй адрес из строки браузера.' : copied ? 'Ссылка скопирована' : ''}</div> : null}
          {headings.length ? <details className="handbook-inline-outline"><summary>На этой странице</summary><nav aria-label="Оглавление статьи">{headings.map(h => <a key={h.id} href={handbookHref(pageId, h.id)} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); openAnchor(h.id) }}>{h.title}</a>)}</nav></details> : null}
          <m.div key={node ? `content-${pageId}` : error ? 'error' : 'loading'}
            initial={node ? spatialMotion ? { opacity: 0, y: 4 } : { opacity: 0.94 } : false}
            animate={{ opacity: 1, y: 0 }} transition={transition}>
            {error ? <div className="handbook-empty" role="alert"><h2>Не удалось открыть страницу</h2><p>Попробуй загрузить ее еще раз.</p><Button variant="outline" onClick={() => setRetry(v => v + 1)}>Повторить</Button></div> : !node ? <div className="handbook-loading" role="status">Загружаем страницу…</div> : <div className="handbook-prose"><HandbookArticle node={node} onOpen={openPage} /></div>}
          </m.div>
          {node && childPages.length ? <section className="handbook-child-pages" aria-labelledby="handbook-child-title"><h2 id="handbook-child-title">{pageId === handbookRootId ? 'Все разделы' : 'Страницы раздела'}</h2><ul>{childPages.map(child => <li key={child.id}><a href={handbookHref(child.id)} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); openPage(child.id) }} onMouseEnter={() => void loadDocument(child.id).catch(() => {})} onFocus={() => void loadDocument(child.id).catch(() => {})}><FileText aria-hidden="true" /><span>{child.title}</span><ChevronRight aria-hidden="true" /></a></li>)}</ul></section> : null}
        </m.article>
        {headings.length ? <aside className="handbook-outline"><nav aria-label="На этой странице"><p>На этой странице</p>{headings.map(h => <a key={h.id} href={handbookHref(pageId, h.id)} aria-current={activeHeading === h.id ? 'location' : undefined} style={{ paddingInlineStart: Math.max(0, h.level - 2) * 8 + 12 }} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); openAnchor(h.id) }}>{h.title}</a>)}</nav></aside> : null}
      </div>}
    </div>
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="left" className="handbook-mobile-sheet"><SheetHeader><SheetTitle>Содержание</SheetTitle><SheetDescription className="sr-only">Разделы и статьи хэндбука</SheetDescription></SheetHeader>{tree}</SheetContent></Sheet>
  </section>
}
