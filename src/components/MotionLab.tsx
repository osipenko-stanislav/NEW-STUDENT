import '@/styles/motion-lab.css'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { ArrowRight, Check, Copy, Download, File, Pin, Plus, Settings, Trash2, TriangleAlert } from 'lucide-react'
import { useSettings } from './SettingsProvider'
import { useAppMotion } from './MotionProvider'
import type { Theme } from './ThemeSwitcher'
import { motionRecipes, notificationRecipe, recipe, recipeTransition } from '@/lib/motion-recipes'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Switch } from './ui/switch'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { SegmentedControl } from './ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Badge } from './ui/badge'
import { AnimatedDisclosure } from './ui/animated-disclosure'
import { AnimatedNumber } from './ui/animated-number'
import { AnimatedStatus } from './ui/animated-status'
import { NotificationIndicator } from './ui/notification-indicator'
import { StateIcon } from './ui/state-icon'
import { SortIndicator } from './ui/sort-indicator'
import { SyncIcon } from './ui/sync-icon'
import { AsyncButton, FeedbackButton, type ActionState } from './ui/feedback-button'
import { CalendarDatePicker } from './ui/calendar-date-picker'
import { NumberStepper } from './ui/number-stepper'

function Spec({ id, title, states, description, children }: { id: string; title: string; states: string; description: string; children: ReactNode }) {
  return <section className="motion-lab-spec" id={id}><h2>{title}</h2><p>{states}</p><small>{description}</small><div className="motion-lab-example">{children}</div></section>
}
/** Loaded by Vite DEV only. Uses the live application's providers and UI primitives. */
export default function MotionLab({ theme, onThemeChange }: { theme: Theme; onThemeChange: (theme: Theme) => void }) {
  const { settings, updateSettings } = useSettings()
  const { effectiveIntensity, spatialMotion } = useAppMotion()
  const [count, setCount] = useState(0)
  const [sound, setSound] = useState<AudioContext | null>(null)
  const soundRef = useRef<AudioContext | null>(null)
  const [checked, setChecked] = useState(false)
  const [mixed, setMixed] = useState(true)
  const [switched, setSwitched] = useState(false)
  const [radio, setRadio] = useState('a')
  const [segment, setSegment] = useState('a')
  const [open, setOpen] = useState(false)
  const [number, setNumber] = useState(15)
  const [days, setDays] = useState('1')
  const [date, setDate] = useState('2026-11-13')
  const [pinned, setPinned] = useState(false)
  const [sort, setSort] = useState<'asc' | 'desc' | null>(null)
  const [action, setAction] = useState<ActionState>('idle')
  const [sync, setSync] = useState(false)
  const [status, setStatus] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [query, setQuery] = useState('')
  const [progress, setProgress] = useState(35)
  const [files, setFiles] = useState<{ id: number; name: string }[]>([])
  const fileSequence = useRef(0)
  useEffect(() => () => { void soundRef.current?.close() }, [])
  async function toggleSound() {
    if (sound) { setSound(null); await sound.suspend(); return }
    const context = soundRef.current ?? new AudioContext()
    soundRef.current = context
    await context.resume() // Only this explicit click enables audio.
    setSound(context)
  }
  const actions: ActionState[] = ['idle', 'loading', 'success', 'error']
  return <div className="page-container layout-workspace motion-lab"><header><h1>Motion Lab</h1><p>DEV · Повторяй переходы, прерывай их и проверяй реальные общие компоненты. Настройки интенсивности и темы принадлежат приложению.</p><a href={import.meta.env.BASE_URL}>Вернуться в приложение</a></header>
    <div className="motion-lab-controls"><label>Интенсивность<Select value={settings.motionIntensity} onValueChange={value => updateSettings({ motionIntensity: value as typeof settings.motionIntensity })}><SelectTrigger aria-label="Интенсивность Motion Lab"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minimal">Минимальная</SelectItem><SelectItem value="balanced">Сбалансированная</SelectItem><SelectItem value="expressive">Выразительная</SelectItem></SelectContent></Select></label><label>Тема<Select value={theme} onValueChange={value => onThemeChange(value as Theme)}><SelectTrigger aria-label="Тема Motion Lab"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="light">Светлая</SelectItem><SelectItem value="dark">Тёмная</SelectItem><SelectItem value="system">Системная</SelectItem></SelectContent></Select></label><output>Эффективная: {effectiveIntensity}</output></div>
    <TooltipProvider><Spec id="lab-bell" title="Notification Bell" states="restored → new → changed → zero" description={`Ring ${notificationRecipe.ring.duration} ms / 18°; slide 260, pop 500, fade 400, close 180; digits 500 ms + 70 ms stagger.`}>
      <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" className="ghost-icon notification-trigger" aria-label={`Уведомления Lab: ${count}`}><NotificationIndicator count={count} soundContext={sound} soundEnabled={!!sound} /></Button></PopoverTrigger><PopoverContent><p>Popover не запускает звонок или звук.</p></PopoverContent></Popover>
      <Button variant="outline" onClick={() => setCount(value => value + 1)}>Новое уведомление</Button><Button variant="outline" onClick={() => setCount(0)}>Прочитать все</Button><Button variant="ghost" aria-pressed={!!sound} onClick={() => void toggleSound()}>Звук: {sound ? 'включён' : 'выключен'}</Button>
    </Spec>
    <Spec id="lab-icons" title="Семантические иконки / Pin / Sort" states="hover / press / active / reverse" description="Стрелка следует действию, gear поворачивается, pin заполняется с импульсом 180 ms и возвращается за 120 ms.">
      <Tooltip><TooltipTrigger asChild><Button variant="outline"><ArrowRight />Далее</Button></TooltipTrigger><TooltipContent>Направление действия</TooltipContent></Tooltip><Button variant="ghost" size="icon" aria-label="Настройки Lab"><Settings /></Button><Button variant="ghost" size="icon" aria-label="Удалить Lab"><Trash2 /></Button><Button variant="ghost" size="icon" aria-label="Закрепить Lab" aria-pressed={pinned} onClick={() => setPinned(value => !value)}><StateIcon state={pinned ? 'pinned' : 'empty'}><Pin fill={pinned ? 'currentColor' : 'none'} /></StateIcon></Button><Button variant="outline" onClick={() => setSort(value => value === 'asc' ? 'desc' : value === 'desc' ? null : 'asc')}>Сортировка<SortIndicator direction={sort} /></Button>
    </Spec>
    <Spec id="lab-check" title="Checkbox / Radio / Switch" states="unchecked / checked / mixed / disabled / press" description="Галочка рисуется 180 ms, radio dot 160 ms, switch использует собственную пружину, без масштаба строки.">
      <label><Checkbox checked={checked} onChange={event => setChecked(event.target.checked)} />Выбор</label><label><Checkbox checked={false} indeterminate={mixed} onChange={() => setMixed(value => !value)} />Смешанный</label><label><Checkbox disabled checked readOnly />Недоступный</label><label><Switch checked={switched} onCheckedChange={setSwitched} aria-label="Переключатель Lab" />Переключатель</label><RadioGroup value={radio} onValueChange={setRadio} aria-label="Radio Lab" className="motion-lab-radio">{['a','b','c'].map(value => <label key={value}><RadioGroupItem value={value} />{value.toUpperCase()}</label>)}</RadioGroup>
    </Spec>
    <Spec id="lab-tabs" title="Tabs / Segments" states="active / keyboard / interruption" description="Один геометрически связанный индикатор 180 ms. Быстрые A→B→C→A не перезапускают весь блок.">
      <Tabs defaultValue="a"><TabsList aria-label="Tabs Lab">{['a','b','c'].map(value => <TabsTrigger key={value} value={value}>{value.toUpperCase()}</TabsTrigger>)}</TabsList>{['a','b','c'].map(value => <TabsContent key={value} value={value}>Содержимое {value.toUpperCase()}</TabsContent>)}</Tabs><SegmentedControl aria-label="Segments Lab">{['a','b','c'].map(value => <Button key={value} variant="ghost" size="sm" aria-pressed={segment === value} onClick={() => setSegment(value)}>{value.toUpperCase()}</Button>)}</SegmentedControl>
    </Spec>
    <Spec id="lab-disclosure" title="Accordion / Disclosure" states="closed / open / interrupted close" description="Естественная высота 220 ms; chevron 180° за 180 ms. Соседние элементы сохраняются.">
      <details className="course-block"><summary>Программа<svg className="course-chevron" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" /></svg></summary><p>Текст раскрывается вместе с высотой. Повторный клик прерывает переход.</p></details><div><Button variant="outline" aria-expanded={open} onClick={() => setOpen(value => !value)}><Plus />Вложенная структура</Button><AnimatedDisclosure open={open}><p>Этот контент остаётся в DOM для плавного закрытия, но недоступен для фокуса в закрытом состоянии.</p></AnimatedDisclosure></div>
    </Spec>
    <Spec id="lab-action" title="Action / Copy / Sync" states="idle / loading / success / error / reset" description="Нет ожидания ради анимации. Copy использует Clipboard Promise. Управляемые состояния позволяют вручную прервать любую фазу.">
      <FeedbackButton state={action} label="Сохранить" loadingLabel="Сохраняем" successLabel="Сохранено" errorLabel="Повторить" icon={<Download />} onClick={() => setAction('loading')} />{actions.map(value => <Button variant="ghost" key={value} onClick={() => setAction(value)}>{value}</Button>)}<AsyncButton variant="outline" label="Копировать" successLabel="Скопировано" errorLabel="Ошибка копирования" icon={<Copy />} action={async () => { await navigator.clipboard.writeText('NEW STUDENT Motion Lab'); return true }} /><Button variant="outline" aria-pressed={sync} onClick={() => setSync(value => !value)}><SyncIcon active={sync} />{sync ? 'Завершить sync' : 'Начать sync'}</Button>
    </Spec>
    <Spec id="lab-data" title="Counter / Status / Progress / Stepper" states="change / reset / input / boundary / error" description="Только изменившийся разряд: 220 ms / 2 px. Статус меняет локальный текст и иконку. Ввод остаётся мгновенным.">
      <AnimatedNumber value={number} /><Button variant="outline" onClick={() => setNumber(value => value + 1)}>+1</Button><Button variant="outline" onClick={() => setNumber(value => value - 1)}>−1</Button><Button variant="ghost" onClick={() => setNumber(15)}>Сбросить 15</Button><Badge variant={status ? 'success' : 'danger'}><AnimatedStatus state={String(status)} label={status ? 'Готово' : 'Ошибка'} choices={['Готово','Ошибка']} icon={status ? <Check /> : <TriangleAlert />} /></Badge><Button variant="outline" onClick={() => setStatus(value => !value)}>Сменить статус</Button><NumberStepper aria-label="Дни Lab" value={days} max={15} onValueChange={setDays} /><output>Остаток: <AnimatedNumber value={15 - (Number(days) || 0)} /></output><label>Прогресс<Input type="range" min={0} max={100} value={progress} onChange={event => setProgress(Number(event.target.value))} /></label><span className="late-days-meter motion-lab-progress" role="progressbar" aria-label="Прогресс Lab" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></span><AnimatedNumber value={progress} />%
    </Spec>
    <Spec id="lab-field" title="Input / Clear / Date Picker" states="focus / clear / invalid / month / selected" description="Focus 120 ms; зарезервированный слот clear; месяц 180 ms / 6 px. Выбор дня не анимирует всю сетку.">
      <div className="motion-lab-field"><Input aria-label="Поле Lab" value={query} aria-invalid={invalid} onChange={event => setQuery(event.target.value)} placeholder="Введи текст" /><span className="motion-lab-clear"><AnimatePresence initial={false}>{query ? <m.span key="clear" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={recipeTransition('field', effectiveIntensity)}><Button variant="ghost" size="icon" aria-label="Очистить Lab" onClick={event => { setQuery(''); event.currentTarget.closest('.motion-lab-field')?.querySelector('input')?.focus() }}>×</Button></m.span> : null}</AnimatePresence></span></div><Button variant="outline" aria-pressed={invalid} onClick={() => setInvalid(value => !value)}>Ошибка поля</Button><CalendarDatePicker value={date} onValueChange={setDate} label="Дата Lab" />
    </Spec>
    <Spec id="lab-files" title="File List / Dropdown / Popover" states="add / remove / reorder / menu / reset" description="Новые строки входят на 4 px за 180 ms, удаление 140 ms, остальные меняют только позицию. Первое открытие не анимирует список.">
      <label className="motion-lab-upload">Добавить файл<Input type="file" aria-label="Файл Lab" onChange={event => { const names = Array.from(event.target.files ?? []).map(file => ({ id: ++fileSequence.current, name: file.name })); setFiles(value => [...value, ...names]); event.target.value = '' }} multiple /></label><Button variant="outline" onClick={() => setFiles(value => [...value].reverse())}>Обратный порядок</Button><ul className="motion-lab-files"><AnimatePresence initial={false}>{files.map(file => <m.li key={file.id} layout={spatialMotion ? 'position' : false} initial={{ opacity: 0, x: recipe('file', effectiveIntensity).distance }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -recipe('file', effectiveIntensity).distance, transition: recipeTransition('file', effectiveIntensity, true) }} transition={recipeTransition('file', effectiveIntensity)}><File aria-hidden="true" /><span>{file.name}</span><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Действия: ${file.name}`}><Settings /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => setFiles(value => value.filter(item => item.id !== file.id))}><Trash2 />Удалить</DropdownMenuItem></DropdownMenuContent></DropdownMenu></m.li>)}</AnimatePresence></ul>
    </Spec></TooltipProvider>
    <footer><h2>Контракты</h2><p>Документы: docs/motion-component-inventory.md и docs/motion-recipes.md. Здесь нет отдельных копий студенческих компонентов.</p><dl className="motion-lab-contracts">{Object.entries(motionRecipes).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value.duration}/{value.exit} ms · cubic-bezier({value.ease.join(', ')})</dd></div>)}</dl></footer>
  </div>
}
