import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { CornerDownLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { quickSearchSections, searchItems, sectionSearchItems } from '@/data/search-items'
import { filterSearchItems, loadRecentSearches, saveRecentSearches } from '@/lib/global-search'
import type { SearchCategory, SearchItem } from '@/types/search'

const categories: { value: SearchCategory; label: string }[] = [
  { value: 'all', label: 'Все' }, { value: 'courses', label: 'Курсы' },
  { value: 'materials', label: 'Материалы' }, { value: 'homework', label: 'Домашки' },
  { value: 'sections', label: 'Разделы' },
]

type GlobalSearchProps = { disabled?: boolean; onNavigate: (section: string) => void; onAskNavigator: (query: string) => void }

export default function GlobalSearch({ onNavigate, onAskNavigator, disabled = false }: GlobalSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SearchCategory>('all')
  const [recentIds, setRecentIds] = useState(loadRecentSearches)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const afterCloseRef = useRef<(() => void) | null>(null)
  const id = useId()
  const listId = `${id}-results`

  const changeOpen = useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setQuery('')
      setCategory('all')
      setSelectedId(null)
    }
    setOpen(nextOpen)
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    const visualViewport = window.visualViewport
    function measure() {
      setViewport({ height: visualViewport?.height ?? window.innerHeight, top: visualViewport?.offsetTop ?? 0 })
    }
    measure()
    visualViewport?.addEventListener('resize', measure)
    visualViewport?.addEventListener('scroll', measure)
    window.addEventListener('resize', measure)
    return () => {
      visualViewport?.removeEventListener('resize', measure)
      visualViewport?.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [open])

  useEffect(() => {
    function shortcut(event: globalThis.KeyboardEvent) {
      if (disabled || !(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== 'k'
        || event.isComposing || event.repeat) return
      event.preventDefault()
      const currentDialog = document.querySelector('[role="dialog"][data-state="open"]:not([data-side])')
      if (currentDialog && currentDialog !== dialogRef.current) return
      if (open) inputRef.current?.focus()
      else changeOpen(true)
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [open, changeOpen, disabled])

  const matches = filterSearchItems(searchItems, query, category)
  const recent = recentIds.map(recentId => sectionSearchItems.find(item => item.id === recentId))
    .filter((item): item is SearchItem => !!item)
  const quick = quickSearchSections.map(title => sectionSearchItems.find(item => item.section === title))
    .filter((item): item is SearchItem => !!item && !recentIds.includes(item.id)).slice(0, 4)
  const isStart = !query.trim() && category === 'all'
  const groups = isStart
    ? [{ label: 'Недавние', items: recent }, { label: 'Быстрые переходы', items: quick }].filter(group => group.items.length > 0)
    : [{ label: query.trim() ? 'Результаты' : categories.find(item => item.value === category)!.label, items: matches }]
  const visibleItems = groups.flatMap(group => group.items)
  const selected = visibleItems.find(item => item.id === selectedId) ?? visibleItems[0]

  useEffect(() => {
    if (open && selected) document.getElementById(`${listId}-${selected.id}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, selected?.id, listId])

  function navigate(item: SearchItem) {
    // Demo objects open a real navigation section, never a fabricated detail page.
    const destination = sectionSearchItems.find(section => section.section === item.section)
    if (!destination) return
    const next = [destination.id, ...recentIds.filter(recentId => recentId !== destination.id)].slice(0, 6)
    setRecentIds(next)
    saveRecentSearches(next)
    afterCloseRef.current = () => onNavigate(destination.section)
    setOpen(false)
  }

  function askNavigator() {
    const text = query.trim()
    if (!text) return
    afterCloseRef.current = () => onAskNavigator(text)
    setOpen(false)
  }

  function handleKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing || event.altKey || event.metaKey || event.ctrlKey) return
    const fromInput = event.target === inputRef.current
    const fromTab = event.target instanceof HTMLElement && event.target.getAttribute('role') === 'tab'
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && (fromInput || fromTab)) {
      event.preventDefault()
      if (!visibleItems.length) return
      const current = fromTab ? -1 : visibleItems.findIndex(item => item.id === selected?.id)
      const next = fromTab
        ? (event.key === 'ArrowDown' ? 0 : visibleItems.length - 1)
        : event.key === 'ArrowDown'
          ? (current + 1) % visibleItems.length
          : (current - 1 + visibleItems.length) % visibleItems.length
      setSelectedId(visibleItems[next].id)
      inputRef.current?.focus()
    }
    if (event.key === 'Enter' && fromInput) {
      event.preventDefault()
      if (selected) navigate(selected)
      else askNavigator()
    }
  }

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild>
      <Button ref={triggerRef} disabled={disabled} type="button" variant="ghost" className="search-field search-trigger" aria-label="Поиск по LMS">
        <Search aria-hidden="true" className="size-4 shrink-0" />
        <span className="flex-1 text-left text-sm text-muted-foreground">Поиск</span>
        <kbd aria-hidden="true">⌘ + K</kbd>
      </Button>
    </DialogTrigger>
    <DialogContent ref={dialogRef} className="global-search-dialog" onKeyDown={handleKeyboard}
      style={viewport ? { maxHeight: Math.max(0, Math.min(640, viewport.height - 32)), top: viewport.top + viewport.height / 2 } : undefined}
      onOpenAutoFocus={event => { event.preventDefault(); inputRef.current?.focus() }}
      onCloseAutoFocus={event => {
        event.preventDefault()
        const action = afterCloseRef.current
        afterCloseRef.current = null
        if (action) { triggerRef.current?.focus(); action() }
        else if (restoreFocusRef.current?.isConnected) restoreFocusRef.current.focus()
        else triggerRef.current?.focus()
      }}>
      <DialogTitle className="sr-only">Поиск по LMS</DialogTitle>
      <DialogDescription className="sr-only">
        Ищите по названию и пути объекта. Стрелки вверх и вниз выбирают результат, Enter открывает раздел, Escape закрывает поиск.
      </DialogDescription>
      <div className="global-search-input-row">
        <Search aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
        <Input ref={inputRef} role="combobox" aria-label="Поисковый запрос" placeholder="Поиск по LMS"
          value={query} autoComplete="off" spellCheck={false} aria-autocomplete="list" aria-expanded={open}
          aria-controls={listId} aria-activedescendant={selected ? `${listId}-${selected.id}` : undefined}
          className="global-search-input border-0 p-0 shadow-none focus-visible:ring-0"
          onChange={event => { setQuery(event.target.value); setSelectedId(null) }} />
      </div>
      <Tabs value={category} onValueChange={value => { setCategory(value as SearchCategory); setSelectedId(null) }}
        className="global-search-tabs-root">
        <div className="global-search-categories">
          <TabsList aria-label="Категории поиска" className="global-search-tabs">
            {categories.map(item => <TabsTrigger key={item.value} value={item.value}>{item.label}</TabsTrigger>)}
          </TabsList>
        </div>
        <TabsContent value={category} className="global-search-panel">
          <div className="global-search-results">
            <div id={listId} role="listbox" aria-label="Результаты поиска">
              {groups.filter(group => group.items.length > 0).map((group, groupIndex) => <div key={group.label}
                role="group" aria-labelledby={`${id}-group-${groupIndex}`}>
                <h3 id={`${id}-group-${groupIndex}`} className="global-search-group-title">{group.label}</h3>
                {group.items.map(item => <button key={item.id} id={`${listId}-${item.id}`} type="button" role="option"
                  tabIndex={-1} aria-selected={item.id === selected?.id} className="global-search-result"
                  aria-label={`${item.title}. ${item.path}${item.demo ? `. Демо. Открыть раздел «${item.section}»` : ''}`}
                  onPointerMove={() => setSelectedId(item.id)} onPointerDown={event => event.preventDefault()}
                  onClick={() => navigate(item)}>
                  <span className="global-search-result-icon"><img
                    src={`${import.meta.env.BASE_URL}assets/figma/${item.icon}`} alt="" aria-hidden="true" className="design-icon" /></span>
                  <span className="global-search-result-copy">
                    <span className="global-search-result-title">{item.title}</span>
                    <span className="global-search-path">{item.path}</span>
                    {item.demo ? <span className="global-search-destination">Перейти в раздел «{item.section}»</span> : null}
                  </span>
                  {item.demo ? <Badge variant="outline" className="global-search-demo">Демо</Badge>
                    : <CornerDownLeft aria-hidden="true" className="global-search-enter" />}
                </button>)}
              </div>)}
            </div>
            {isStart && !recent.length ? <p className="global-search-recent-hint">Недавних переходов пока нет</p> : null}
            {!visibleItems.length ? <div className="global-search-empty">
              <Search aria-hidden="true" className="mx-auto size-7 text-muted-foreground" />
              <h3>Ничего не нашлось</h3>
              <p>Попробуйте другое название или передайте запрос Навигатору.</p>
              <Button type="button" variant="outline" onClick={askNavigator}>Спросить Навигатор</Button>
              <p className="global-search-empty-hint">Запрос появится в поле ввода.</p>
            </div> : null}
          </div>
        </TabsContent>
      </Tabs>
      <div className="global-search-footer" aria-hidden="true">
        <span><kbd>↑↓</kbd> Выбор</span>
        <span><kbd>↵</kbd> {selected ? 'Открыть раздел' : 'В Навигатор'}</span>
        <span><kbd>Esc</kbd> Закрыть</span>
      </div>
      <span className="sr-only" role="status">{isStart ? 'Быстрые переходы и недавние разделы' : `Найдено: ${visibleItems.length}`}</span>
    </DialogContent>
  </Dialog>
}
