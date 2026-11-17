import { useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, ListFilter, Search, X } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Checkbox } from './checkbox'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { filterOperators, isMultipleFilter, needsFilterValue, type FilterCondition, type FilterField } from '@/lib/filters'

type Step = 'field' | 'operator' | 'value'
type EditorProps = {
  fields: FilterField[]
  condition?: FilterCondition
  onChange: (condition: FilterCondition) => void
}
function FilterEditor({ fields, condition, onChange }: EditorProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<FilterCondition | null>(condition ?? null)
  const [step, setStep] = useState<Step>('field')
  const [query, setQuery] = useState('')
  const content = useRef<HTMLDivElement>(null)
  const field = fields.find(item => item.id === draft?.field)
  const operator = filterOperators.find(item => item.value === draft?.operator)
  const selectedField = fields.find(item => item.id === condition?.field)
  const summary = condition?.values.map(value => selectedField?.options.find(item => item.value === value)?.label ?? value).join(', ')
  function move(next: Step) {
    setStep(next); setQuery('')
    requestAnimationFrame(() => content.current?.focus({ preventScroll: true }))
  }
  function commit(next: FilterCondition) { setDraft(next); onChange(next) }
  function changeOpen(next: boolean) {
    setOpen(next); setQuery('')
    if (next) {
      setDraft(condition ?? { id: crypto.randomUUID(), field: '', operator: null, values: [] })
      setStep(condition ? needsFilterValue(condition.operator) ? 'value' : 'operator' : 'field')
    }
  }
  const term = query.trim().toLocaleLowerCase('ru')
  const options = step === 'field' ? fields.map(item => ({ value: item.id, label: item.label })) : step === 'operator' ? filterOperators : field?.options ?? []
  const visible = options.filter(item => item.label.toLocaleLowerCase('ru').includes(term))
  function choose(value: string) {
    if (!draft) return
    if (step === 'field') { commit({ ...draft, field: value, operator: null, values: [] }); move('operator'); return }
    if (step === 'operator') {
      const nextOperator = filterOperators.find(item => item.value === value)!.value
      commit({ ...draft, operator: nextOperator, values: needsFilterValue(nextOperator) ? draft.values.slice(0, isMultipleFilter(nextOperator) ? undefined : 1) : [] })
      if (needsFilterValue(nextOperator)) move('value'); else setOpen(false)
      return
    }
    const multiple = isMultipleFilter(draft.operator)
    commit({ ...draft, values: multiple ? draft.values.includes(value) ? draft.values.filter(item => item !== value) : [...draft.values, value] : [value] })
    if (!multiple) setOpen(false)
  }
  return <Popover open={open} onOpenChange={changeOpen}>
    <PopoverTrigger asChild>
      {condition ? <Button type="button" variant="ghost" className="filter-chip-edit" aria-label={`Изменить фильтр: ${selectedField?.label ?? condition.field}`}>
        <span className="filter-chip-field">{selectedField?.label ?? condition.field}</span>
        <span className="filter-chip-operator">{filterOperators.find(item => item.value === condition.operator)?.label ?? 'Условие'}</span>
        {needsFilterValue(condition.operator) ? <span className="filter-chip-values">{summary || 'Выбери значение'}</span> : null}
      </Button> : <Button type="button" variant="outline" className="filter-add"><ListFilter aria-hidden="true" />Фильтры</Button>}
    </PopoverTrigger>
    <PopoverContent ref={content} align="start" collisionPadding={16} className="filter-builder-popover" aria-label="Настройка фильтра"
      onOpenAutoFocus={event => { event.preventDefault(); content.current?.focus({ preventScroll: true }) }}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft' && step !== 'field' && !(event.target instanceof HTMLInputElement && event.target.type === 'text' && event.target.value)) {
          event.preventDefault(); move(step === 'value' ? 'operator' : 'field'); return
        }
        if (event.key === 'ArrowRight' && step !== 'value' && event.target instanceof HTMLButtonElement && event.target.closest('.filter-option')) {
          event.preventDefault(); event.target.click(); return
        }
        if (['Home', 'End'].includes(event.key) && event.target instanceof HTMLInputElement && event.target.type === 'text') return
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
        const items = [...event.currentTarget.querySelectorAll<HTMLElement>('.filter-option button, .filter-option input')]
        if (!items.length) return
        event.preventDefault()
        const current = items.indexOf(document.activeElement as HTMLElement)
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : current < 0 ? event.key === 'ArrowUp' ? items.length - 1 : 0 : (current + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length
        items[next]?.focus()
      }}>
      {step !== 'field' ? <div className="filter-builder-path">
        <Button type="button" variant="ghost" size="icon" aria-label="Назад к параметрам фильтра" onClick={() => move(step === 'value' ? 'operator' : 'field')}><ArrowLeft aria-hidden="true" /></Button>
        <Button type="button" variant="ghost" onClick={() => move('field')}>{field?.label}</Button>
        {step === 'value' ? <><ChevronRight aria-hidden="true" /><Button type="button" variant="ghost" onClick={() => move('operator')}>{operator?.label}</Button></> : null}
      </div> : null}
      <div className="filter-builder-search"><Search aria-hidden="true" /><Input type="text" value={query} onChange={event => setQuery(event.target.value)} placeholder={step === 'field' ? 'Найти параметр' : step === 'operator' ? 'Найти условие' : 'Найти значение'} aria-label={step === 'field' ? 'Поиск параметра фильтра' : step === 'operator' ? 'Поиск условия фильтра' : 'Поиск значения фильтра'} /></div>
      <div className="filter-builder-options" role="group" aria-label={step === 'field' ? 'Параметры фильтра' : step === 'operator' ? 'Условия фильтра' : 'Значения фильтра'}>
        {visible.map(item => <div key={item.value} className="filter-option">
          {step === 'value' && isMultipleFilter(draft?.operator ?? null) ? <label><Checkbox checked={draft?.values.includes(item.value) ?? false} onChange={() => choose(item.value)} /><span>{item.label}</span></label>
            : <button type="button" onClick={() => choose(item.value)}><span>{item.label}</span>{step === 'field' || (step === 'operator' && needsFilterValue(item.value as NonNullable<FilterCondition['operator']>)) ? <ChevronRight aria-hidden="true" /> : step === 'value' && draft?.values.includes(item.value) ? <Check aria-hidden="true" /> : null}</button>}
        </div>)}
        {!visible.length ? <p className="filter-builder-empty">Ничего не найдено</p> : null}
      </div>
    </PopoverContent>
  </Popover>
}
export function FilterBuilder({ fields, conditions, onChange, label = 'Фильтры', className = '' }: {
  fields: FilterField[]; conditions: FilterCondition[]; onChange: (conditions: FilterCondition[]) => void; label?: string; className?: string
}) {
  const trigger = useRef<HTMLDivElement>(null)
  function update(next: FilterCondition) { onChange(conditions.some(item => item.id === next.id) ? conditions.map(item => item.id === next.id ? next : item) : [...conditions, next]) }
  return <div className={`filter-builder ${className}`} role="group" aria-label={label}>
    {conditions.map(condition => <div key={condition.id} className="filter-chip">
      <FilterEditor fields={fields} condition={condition} onChange={update} />
      <Button type="button" variant="ghost" size="icon" className="filter-chip-remove" aria-label={`Убрать фильтр: ${fields.find(item => item.id === condition.field)?.label ?? condition.field}`} onClick={() => { onChange(conditions.filter(item => item.id !== condition.id)); trigger.current?.querySelector<HTMLButtonElement>('button')?.focus() }}><X aria-hidden="true" /></Button>
    </div>)}
    <div ref={trigger}><FilterEditor fields={fields} onChange={update} /></div>
    {conditions.length ? <Button type="button" variant="ghost" className="filter-reset" onClick={() => { onChange([]); trigger.current?.querySelector<HTMLButtonElement>('button')?.focus() }}>Сбросить</Button> : null}
  </div>
}
