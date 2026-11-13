import { useId, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, m } from 'motion/react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppMotion } from '@/components/MotionProvider'
import { recipe, recipeTransition } from '@/lib/motion-recipes'
import { addDays, moscowDate } from '@/lib/schedule'
import { Button } from './button'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
type Props = { value: string; onValueChange: (date: string) => void; id?: string; min?: string; max?: string; label?: string; disabled?: boolean; inline?: boolean }
export function CalendarDatePicker({ value, onValueChange, id, min, max, label = 'Выбрать дату', disabled, inline = false }: Props) {
  const { effectiveIntensity, spatialMotion } = useAppMotion()
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => (value || moscowDate()).slice(0, 7))
  const [focus, setFocus] = useState(value || moscowDate())
  const [direction, setDirection] = useState(1)
  const grid = useRef<HTMLDivElement>(null)
  const pendingFocus = useRef(false)
  useLayoutEffect(() => {
    if (!pendingFocus.current) return
    const target = grid.current?.querySelector<HTMLElement>(`[data-date="${focus}"]`)
    if (target) { pendingFocus.current = false; target.focus() }
  }, [focus, month])
  const uid = useId()
  const first = `${month}-01`
  const firstDay = new Date(`${first}T12:00:00Z`).getUTCDay()
  const start = addDays(first, -((firstDay + 6) % 7))
  const dates = Array.from({ length: 42 }, (_, index) => addDays(start, index))
  const enabled = (date: string) => (!min || date >= min) && (!max || date <= max)
  const tabDate = focus.startsWith(month) && enabled(focus) ? focus : dates.find(date => date.startsWith(month) && enabled(date))
  const title = new Intl.DateTimeFormat('ru', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${first}T12:00:00Z`))
  function move(amount: number, focusGrid = false) {
    const base = new Date(`${first}T12:00:00Z`)
    base.setUTCMonth(base.getUTCMonth() + amount)
    setDirection(amount > 0 ? 1 : -1)
    const nextMonth = base.toISOString().slice(0, 7)
    if (focusGrid) {
      const last = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate()
      const target = `${nextMonth}-${String(Math.min(Number(focus.slice(-2)), last)).padStart(2, '0')}`
      if (!enabled(target)) return
      pendingFocus.current = true
      setFocus(target)
    }
    setMonth(nextMonth)
  }
  function focusDate(date: string) {
    if (!enabled(date)) return
    if (!date.startsWith(month)) { setDirection(date > first ? 1 : -1); setMonth(date.slice(0, 7)) }
    pendingFocus.current = true
    setFocus(date)
  }
  const calendar = <>
      <header className="calendar-month-heading"><Button type="button" variant="ghost" size="icon" aria-label="Предыдущий месяц" onClick={() => move(-1)}><ChevronLeft aria-hidden="true" /></Button><h3 id={`${uid}-month`}>{title}</h3><Button type="button" variant="ghost" size="icon" aria-label="Следующий месяц" onClick={() => move(1)}><ChevronRight aria-hidden="true" /></Button></header>
      <div className="calendar-weekdays" aria-hidden="true">{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(day => <span key={day}>{day}</span>)}</div>
      <div ref={grid} className="calendar-grid-host"><LayoutGroup id={uid}><AnimatePresence initial={false} mode="popLayout"><m.div key={month} className="calendar-grid" role="grid" aria-labelledby={`${uid}-month`} initial={{ opacity: .65, x: spatialMotion ? recipe('calendar', effectiveIntensity).distance * direction : 0 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: spatialMotion ? -recipe('calendar', effectiveIntensity).distance * direction : 0 }} transition={recipeTransition('calendar', effectiveIntensity)}>
        {Array.from({ length: 6 }, (_, week) => <div role="row" className="calendar-week" key={week}>{dates.slice(week * 7, week * 7 + 7).map(date => date.startsWith(month) ? <Button key={date} type="button" variant="ghost" size="sm" role="gridcell" className="calendar-day" data-date={date} tabIndex={date === tabDate ? 0 : -1} disabled={!enabled(date)} aria-selected={date === value} aria-label={new Intl.DateTimeFormat('ru', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))} onFocus={() => setFocus(date)} onKeyDown={event => {
          const shift = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]
          if (shift !== undefined) { event.preventDefault(); focusDate(addDays(date, shift)) }
          if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); const offset = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7; focusDate(addDays(date, event.key === 'Home' ? -offset : 6 - offset)) }
          if (event.key === 'PageUp' || event.key === 'PageDown') { event.preventDefault(); move(event.key === 'PageUp' ? -1 : 1, true) }
        }} onClick={() => { onValueChange(date); setFocus(date); setOpen(false) }}>{date === value ? <m.span layoutId="selected-date" className="calendar-selected-day" initial={false} transition={recipeTransition('calendar', effectiveIntensity)} /> : null}<span>{Number(date.slice(-2))}</span></Button> : <span key={date} role="gridcell" aria-hidden="true" />)}</div>)}
      </m.div></AnimatePresence></LayoutGroup></div>
  </>
  const field = <span className="calendar-date-field"><Input id={id} type="date" value={value} min={min} max={max} disabled={disabled} aria-label={id ? undefined : label} onChange={event => onValueChange(event.target.value)} />{!inline ? <PopoverTrigger asChild><Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={`Открыть календарь: ${label}`}><CalendarDays aria-hidden="true" /></Button></PopoverTrigger> : null}</span>
  if (inline) return <div className="calendar-inline">{field}{calendar}</div>
  return <Popover open={open} onOpenChange={next => { if (next) { setMonth((value || moscowDate()).slice(0, 7)); setFocus(value || moscowDate()) }; setOpen(next) }}>
    {field}
    <PopoverContent className="calendar-popover" align="start" collisionPadding={16} aria-labelledby={`${uid}-month`} onOpenAutoFocus={event => { event.preventDefault(); requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()) }}>{calendar}</PopoverContent>
  </Popover>
}
