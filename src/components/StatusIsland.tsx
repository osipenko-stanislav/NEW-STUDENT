import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Check, ChevronDown, LoaderCircle, TriangleAlert, X } from 'lucide-react'
import { actionStatus, type StatusTask } from '@/lib/action-status'
import { statusIslandParameters, statusIslandRecipe } from '@/lib/motion-recipes'
import { useAppMotion } from '@/components/MotionProvider'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { Button } from '@/components/ui/button'
import { StateIcon } from '@/components/ui/state-icon'

function TaskIcon({ task }: { task: StatusTask }) {
  const { spatialMotion } = useAppMotion()
  return <span className="status-island-icon" data-state={task.status}><StateIcon state={task.status}>{task.status === 'running' ? <LoaderCircle className={spatialMotion ? 'action-spinner' : undefined} /> : task.status === 'success' ? <Check /> : <TriangleAlert />}</StateIcon></span>
}
function TaskCopy({ task }: { task: StatusTask }) {
  return <span className="status-island-copy"><span>{task.label}</span>{task.detail ? <span className="status-island-detail">{task.detail}</span> : null}</span>
}
export default function StatusIsland() {
  const tasks = useSyncExternalStore(actionStatus.subscribe, actionStatus.getSnapshot)
  const current = tasks.at(-1)
  const { effectiveIntensity } = useAppMotion()
  const motion = statusIslandParameters(effectiveIntensity)
  const [open, setOpen] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [resumedAt, setResumedAt] = useState(0)
  const [position, setPosition] = useState({ left: 0, top: 76, width: 0 })
  const root = useRef<HTMLDivElement>(null)
  const pill = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const focusList = useRef(false)
  const modalOpen = useRef(false)
  const listId = useId()
  const expanded = open && !blocked && !!current
  const paused = useRef(false)
  paused.current = expanded || blocked
  function close(restore = false) {
    setOpen(false); setResumedAt(Date.now())
    if (restore) requestAnimationFrame(() => pill.current?.focus({ preventScroll: true }))
  }
  useLayoutEffect(() => {
    const header = document.querySelector('.student-header')
    if (!header) return
    const measure = () => { const rect = header.getBoundingClientRect(); setPosition({ left: rect.left, top: rect.bottom + 12, width: rect.width }) }
    measure()
    const observer = new ResizeObserver(measure); observer.observe(header)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [])
  useEffect(() => {
    const check = () => {
      const next = !!document.querySelector('[aria-modal="true"][data-state="open"], [data-slot="dialog-content"][data-state="open"], [data-slot="sheet-content"][data-state="open"]')
      if (next !== modalOpen.current) {
        if (next) { paused.current = true; setOpen(false) }
        else setResumedAt(Date.now())
        modalOpen.current = next
        setBlocked(next)
      }
    }
    check()
    const observer = new MutationObserver(check); observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state', 'aria-modal'] })
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (expanded || blocked) return
    const timers = tasks.filter(task => task.status === 'success').map(task => setTimeout(() => { if (!paused.current) actionStatus.dismiss(task.id, task.revision) }, Math.max(0, Math.max(task.updatedAt, resumedAt) + statusIslandRecipe.dismissAfter - Date.now())))
    return () => { timers.forEach(clearTimeout) }
  }, [tasks, expanded, blocked, resumedAt])
  useEffect(() => {
    if (expanded && focusList.current) { list.current?.focus({ preventScroll: true }); focusList.current = false }
    if (!current) {
      if (root.current?.contains(document.activeElement)) previousFocus.current?.focus({ preventScroll: true })
      setOpen(false)
    }
  }, [expanded, current])
  useEffect(() => {
    if (!expanded) return
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) close() }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [expanded])
  return <>
    <output className="sr-only" aria-live="polite" aria-atomic="true">{current ? [current.label, current.detail].filter(Boolean).join('. ') : ''}</output>
    <div className="status-island-host" style={position}>
      <AnimatePresence>{current ? <m.div key="island" className="status-island-presence" initial={{ opacity: 0, y: motion.distance, filter: motion.blur }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: motion.distance, filter: motion.blur }} transition={motion.swap}>
        {Array.from({ length: Math.min(tasks.length - 1, 2) }, (_, index) => <m.div key={index} aria-hidden="true" className="status-island-peek" initial={false} animate={{ opacity: expanded || motion.minimal ? 0 : 1 - (index + 1) * .3, y: expanded || motion.minimal ? 0 : -(index + 1) * statusIslandRecipe.peek, scale: motion.minimal ? 1 : 1 - (index + 1) * .06 }} transition={motion.morph} style={{ zIndex: -1 - index }} />)}
        <m.div ref={root} layout={!motion.minimal} transition={motion.morph} className="status-island" inert={blocked || undefined} data-expanded={expanded}
          onPointerDown={() => { if (document.activeElement instanceof HTMLElement && !root.current?.contains(document.activeElement)) previousFocus.current = document.activeElement }}
          onFocusCapture={event => { if (event.relatedTarget instanceof HTMLElement && !root.current?.contains(event.relatedTarget)) previousFocus.current = event.relatedTarget }}
          onPointerEnter={event => { if (event.pointerType === 'mouse' && !blocked) setOpen(true) }}
          onPointerLeave={event => { if (event.pointerType === 'mouse' && !root.current?.contains(document.activeElement)) close() }}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close() }}
          onKeyDown={event => { if (event.key === 'Escape' && expanded) { event.stopPropagation(); event.preventDefault(); close(true) } }}>
          {expanded ? <m.div key="expanded" layout={!motion.minimal ? 'position' : false} initial={{ opacity: 0, filter: motion.blur }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={motion.swap}>
            <header className="status-island-heading"><span>Действия</span><Button variant="ghost" size="icon" aria-label="Свернуть статусы" aria-expanded={true} aria-controls={listId} onClick={() => close(true)}><ChevronDown aria-hidden="true" /></Button></header>
            <ul ref={list} id={listId} tabIndex={-1} className="status-island-list" aria-label="Статусы твоих действий">{tasks.map(task => <li key={task.id}><TaskIcon task={task} /><TaskCopy task={task} />{task.status === 'running' && task.progress !== undefined ? <span className="status-island-progress"><AnimatedNumber value={Math.round(task.progress * 100)} />%</span> : null}{task.status !== 'running' ? <Button variant="ghost" size="icon" aria-label={`Скрыть статус: ${task.label}`} onClick={() => { actionStatus.dismiss(task.id); requestAnimationFrame(() => list.current?.focus({ preventScroll: true })) }}><X aria-hidden="true" /></Button> : null}</li>)}</ul>
          </m.div> : <button ref={pill} type="button" className="status-island-pill" aria-expanded={false} aria-controls={listId} aria-label={`${current.label}. Показать все статусы: ${tasks.length}`} onClick={() => { focusList.current = true; setOpen(true) }}>
            <AnimatePresence initial={false} mode="popLayout"><m.span key={`${current.id}-${current.status}`} className="status-island-summary" layout={!motion.minimal ? 'position' : false} initial={{ opacity: 0, y: motion.swapDistance, filter: motion.blur }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -motion.swapDistance, filter: motion.blur }} transition={motion.swap}><TaskIcon task={current} /><TaskCopy task={current} />{current.progress !== undefined && current.status === 'running' ? <span className="status-island-progress"><AnimatedNumber value={Math.round(current.progress * 100)} />%</span> : tasks.length > 1 ? <span className="status-island-count"><AnimatedNumber value={tasks.length} /></span> : null}</m.span></AnimatePresence>
          </button>}
        </m.div>
      </m.div> : null}</AnimatePresence>
    </div>
  </>
}
