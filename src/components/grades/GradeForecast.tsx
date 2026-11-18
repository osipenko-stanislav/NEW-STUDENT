import HomeworkPersonalControl from '@/components/courses/HomeworkPersonalControl'
import { useEffect, useRef, useState } from 'react'
import { ListTree, RotateCcw } from 'lucide-react'
import { forecastScenarios } from '@/data/forecast-scenarios'
import { useNavigation } from '@/hooks/use-navigation'
import { ForecastChart } from './ForecastChart'
import '@/grades.css'
import '@/handbook.css'
import { forecastWorks, calculateForecast } from '@/lib/grade-forecast'
import { formatGrade } from '@/lib/grade-calculation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { AnimatedNumber } from '@/components/ui/animated-number'


const statements = forecastScenarios
export function GradeForecast() {
  const { studyTarget } = useNavigation()
  const [selected, setSelected] = useState(() => statements.find(statement => statement.courseId === studyTarget)?.id ?? statements[0]?.id ?? '')
  const [mobileOpen, setMobileOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const courseList = <nav className="handbook-tree forecast-course-list" aria-label="Курсы прогноза"><ul>{statements.map(statement => <li key={statement.id}><div className="handbook-tree-row" data-active={selected === statement.id}><button type="button" aria-current={selected === statement.id ? 'page' : undefined} onClick={() => { setSelected(statement.id); setMobileOpen(false); if (scrollRef.current) scrollRef.current.scrollTop = 0 }}>{statement.title}</button></div></li>)}</ul></nav>
  return <section className="handbook-workspace forecast-workspace" aria-label="Прогноз">
    <aside className="handbook-sidebar">{courseList}</aside>
    <div className="handbook-reading-area" ref={scrollRef}><div className="page-container forecast-content" data-layout="workspace">
      <Button type="button" variant="outline" className="forecast-mobile-courses" onClick={() => setMobileOpen(true)}><ListTree aria-hidden="true" />{statements.find(statement => statement.id === selected)?.title ?? 'Выбрать курс'}</Button>
      <h1 className="sr-only">{statements.find(statement => statement.id === selected)?.title}</h1>
      <ForecastScenario key={selected} statementId={selected} />
    </div></div>
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="left" width="navigation" className="handbook-mobile-sheet"><SheetHeader><SheetTitle>Курсы</SheetTitle><SheetDescription className="sr-only">Выбери курс для прогноза</SheetDescription></SheetHeader>{courseList}</SheetContent></Sheet>
  </section>
}

function ForecastScenario({ statementId }: { statementId: string }) {
  const [target, setTarget] = useState(8)
  const [resetRevision, setResetRevision] = useState(0)
  const [expected, setExpected] = useState<Record<string, number>>({})
  const statement = statements.find(item => item.id === statementId)
  const works = statement ? forecastWorks(statement.formula ?? [], statement.tasks) : null
  if (!works) return <p className="forecast-explanation" role="status">Для расчёта не хватает согласованных данных о составе работ и их весах. Прогноз появится, когда формула и список заданий будут полными.</p>
  const scenarioExpected = Object.fromEntries(works.filter(work => work.grade === null).map(work => [work.id, expected[work.id] ?? 7]))
  const result = calculateForecast(works, scenarioExpected, target)
  const modified = target !== 8 || Object.keys(expected).length > 0
  return <>
    <div className="forecast-overview">
    <p className="forecast-explanation">Меняй ожидаемые баллы — твои оценки в ведомости останутся прежними. Шкала 0–10, работы внутри активности равновесны. Начальное ожидание — 7 за каждую работу.</p>
    <Card className="forecast-metrics" aria-label="Результаты прогноза"><CardContent><dl className="forecast-summary"><div><dt>Накоплено</dt><dd>{formatGrade(result.current)}</dd></div><div><dt>Максимально достижимо</dt><dd>{formatGrade(result.maximum)}</dd></div><div><dt>По твоему сценарию</dt><dd><AnimatedNumber value={result.projected} formatValue={formatGrade} /></dd></div></dl></CardContent></Card>
    </div>
    <div className="forecast-goal">
    <label className="forecast-target" htmlFor="forecast-target"><span>Целевой результат <small>до округления</small></span><ScoreInput key={`target-${resetRevision}`} id="forecast-target" max={works.reduce((sum, work) => sum + 10 * work.weight, 0)} value={target} onValueChange={setTarget} /></label>
    <p className="forecast-verdict" role="status">{!result.reachable ? `Цель недостижима: даже максимум за оставшиеся работы даст ${formatGrade(result.maximum)}. Не хватает ${formatGrade(target - result.maximum)}.` : result.achieved ? 'Цель уже обеспечена набранными баллами.' : `На оставшихся работах нужно в среднем ${formatGrade(result.required)} из 10 с учётом весов.`}{!result.remaining.length ? ' Все работы завершены; менять результат в этом сценарии нельзя.' : ''}</p>
    </div>
    <Card className="forecast-chart-card"><CardContent><ForecastChart current={result.current} remaining={result.remaining} expected={scenarioExpected} target={target} /></CardContent></Card>
    <div className="forecast-work-plan">
    {result.remaining.length ? <div className="grades-table-shell"><Table className="forecast-table"><caption>Ожидаемые баллы за оставшиеся работы</caption><TableHeader><TableRow><TableHead scope="col">Работа</TableHead><TableHead scope="col">Вес в итоге</TableHead><TableHead scope="col">Баллы из 10</TableHead></TableRow></TableHeader><TableBody>{result.remaining.map(work => <TableRow key={work.id}><TableCell>{work.title}<small>№ {result.remaining.indexOf(work) + 1} · Пока без оценки{work.status === 'rejected' ? ' · Отклонено' : work.status === 'submitted' ? ' · На проверке' : ''}</small><HomeworkPersonalControl taskId={work.id} /></TableCell><TableCell>{formatGrade(work.weight * 100)}%</TableCell><TableCell><ScoreInput key={`${work.id}-${resetRevision}`} label={`Ожидаемые баллы: ${work.title}`} max={10} value={scenarioExpected[work.id]} onValueChange={value => setExpected(current => ({ ...current, [work.id]: value }))} /></TableCell></TableRow>)}</TableBody></Table></div> : null}
    <div className="forecast-footer">
    <details className="forecast-rules"><summary>Как считается прогноз</summary><p>Расчётная модель: каждая работа оценивается от 0 до 10; внутри активности работы имеют равный вес. Веса активностей взяты из формулы ведомости, включая бонусы, без приведения суммы к 100%. Накоплено — сумма вкладов оценённых работ в конечный результат; работы без оценки дают 0, в том числе отклонённые. В сценарии ты можешь задать для них ожидаемые баллы — это не означает разрешение пересдачи. Максимум предполагает 10 за каждую оставшуюся работу. Начальный сценарий — 7 из 10 за каждую оставшуюся работу; это ожидание, которое ты можешь изменить. Итоговая оценка, правила округления и пересдач здесь не определяются. Числа на экране показаны с точностью до двух знаков.</p></details>
    <Button type="button" variant="outline" disabled={!modified} onClick={() => { setTarget(8); setExpected({}); setResetRevision(revision => revision + 1) }}><RotateCcw aria-hidden="true" />Сбросить сценарий</Button>
    </div>
    </div>
  </>
}

function ScoreInput({ value, max, onValueChange, id, label }: { value: number; max: number; onValueChange: (value: number) => void; id?: string; label?: string }) {
  const [draft, setDraft] = useState(String(value))
  const [focused, setFocused] = useState(false)
  useEffect(() => { if (!focused) setDraft(String(value)) }, [value, focused])
  const parsed = draft.trim() === '' ? NaN : Number(draft.replace(',', '.'))
  const invalid = draft !== '' && (!Number.isFinite(parsed) || parsed < 0 || parsed > max)
  return <span className="forecast-score-input"><Input id={id} aria-label={label} type="text" inputMode="decimal" value={draft} aria-invalid={invalid || undefined} onFocus={() => setFocused(true)} onChange={event => {
    const next = event.currentTarget.value
    if (!/^\d*(?:[.,]\d*)?$/.test(next)) return
    setDraft(next)
    const amount = next.trim() === '' ? NaN : Number(next.replace(',', '.'))
    if (Number.isFinite(amount) && amount >= 0 && amount <= max) onValueChange(amount)
  }} onBlur={() => {
    const next = Number.isFinite(parsed) ? Math.max(0, Math.min(max, parsed)) : value
    onValueChange(next)
    setDraft(String(next))
    setFocused(false)
  }} />{invalid ? <small role="status">От 0 до {formatGrade(max)}</small> : null}</span>
}
