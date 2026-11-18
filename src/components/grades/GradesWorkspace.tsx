import { isHomeworkSkipped } from '@/lib/homework-storage'
import HomeworkPersonalControl from '@/components/courses/HomeworkPersonalControl'
import { GradeValue } from '@/components/ui/grade-value'
import { AnimatedStatus } from '@/components/ui/animated-status'
import { SortIndicator } from '@/components/ui/sort-indicator'
import { EmptyState } from '@/components/ui/empty-state'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { academicTasks } from '@/data/academic-data'
import { navigate, useNavigation } from '@/hooks/use-navigation'
import { useLayoutEffect, useRef, useState } from 'react'
import { BookOpen, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Circle, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FilterBuilder } from '@/components/ui/filter-builder'
import { filterOptions, matchesFilters, type FilterCondition } from '@/lib/filters'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { gradeStatements, type GradeStatement, type GradeTask } from '@/data/grades'
import { academicScope, type AcademicScope } from '@/lib/academic-scope'
import { calculateGrade, weightedGrade } from '@/lib/grade-calculation'

type SortKey = 'title' | 'grade' | 'semester' | 'format'
type Sort = { key: SortKey; descending: boolean } | null
function Help({ label, children }: { label: string; children: string }) {
  return <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="grades-help" aria-label={label}><CircleHelp aria-hidden="true" /></Button></TooltipTrigger><TooltipContent className="max-w-72">{children}</TooltipContent></Tooltip>
}
function Empty({ title, children, onReset }: { title: string; children: string; onReset?: () => void }) {
  return <EmptyState className="grades-empty" icon={BookOpen} title={title} description={children} action={onReset ? <Button type="button" variant="outline" onClick={onReset}>Сбросить фильтры</Button> : null} />
}
function TaskStatus({ status }: { status: GradeTask['status'] }) {
  const Icon = status === 'Сдано' ? Check : status === 'Отклонено' ? X : status === 'На проверке' || status === 'В процессе' ? Clock3 : Circle
  return <Badge variant={status === 'Сдано' ? 'success' : status === 'Отклонено' ? 'danger' : status === 'Не начато' ? 'neutral' : 'active'}><AnimatedStatus state={status} label={status} icon={<Icon aria-hidden="true" />} choices={["Сдано", "Отклонено", "На проверке", "В процессе", "Не начато"]} /></Badge>
}
function Formula({ statement }: { statement: GradeStatement }) {
  if (!statement.formula?.length) return <Empty title="Формула оценки не добавлена">Информация о весах активностей появится здесь.</Empty>
  const result = calculateGrade(statement.formula)
  const hasCounts = statement.formula.some(row => row.completed !== undefined)
  return <>
    <div className="grades-table-shell grades-desktop"><Table className="grades-formula-table"><caption className="sr-only">Расчет оценки: {statement.title}</caption>
      <TableHeader><TableRow><TableHead scope="col">Активность</TableHead>{hasCounts ? <TableHead scope="col">Заданий выполнено</TableHead> : null}<TableHead scope="col">Средний балл<Help label="Как считается средний балл">Средний балл за активность из ведомости.</Help></TableHead><TableHead scope="col">Вес</TableHead><TableHead scope="col">Итог за активность<Help label="Как считается итог за активность">Средний балл умножается на вес активности. Бонус учитывается дополнительно.</Help></TableHead></TableRow></TableHeader>
      <TableBody>{statement.formula.map(row => <TableRow key={row.id}><TableCell className="font-medium">{row.title}{row.bonus ? <Badge variant="outline" className="ml-2">Бонус</Badge> : null}</TableCell>{hasCounts ? <TableCell>{row.completed !== undefined ? `${row.completed}/${row.total}` : '—'}</TableCell> : null}<TableCell>{<GradeValue value={row.average} />}</TableCell><TableCell>{row.weight}%</TableCell><TableCell className="font-medium">{<GradeValue value={weightedGrade(row.average, row.weight)} />}</TableCell></TableRow>)}</TableBody>
    </Table></div>
    <div className="grades-mobile grades-formula-cards">{statement.formula.map(row => <Card key={row.id} className="grades-formula-card"><h2>{row.title}{row.bonus ? <Badge variant="outline">Бонус</Badge> : null}</h2><dl>{hasCounts ? <div><dt>Заданий выполнено</dt><dd>{row.completed !== undefined ? `${row.completed}/${row.total}` : '—'}</dd></div> : null}<div><dt>Средний балл</dt><dd>{<GradeValue value={row.average} />}</dd></div><div><dt>Вес</dt><dd>{row.weight}%</dd></div><div><dt>Итог за активность</dt><dd>{<GradeValue value={weightedGrade(row.average, row.weight)} />}</dd></div></dl></Card>)}</div>
    <div className="grades-total"><div><span>Итог за курс</span><p>До округления: {<GradeValue value={result.raw} />}<Help label="Округление итоговой оценки">Итог округляется до целого по правилам математического округления.</Help></p></div><strong>{<GradeValue value={result.rounded} />}</strong></div>
  </>
}
function Earned({ statement }: { statement: GradeStatement }) {
  const records = useHomeworkRecords()
  function openTask(id: string) {
    const task = academicTasks.find(item => item.id === id)
    if (task) navigate({ section: 'Курсы', studyTarget: task.courseId, courseId: task.courseId, lessonId: null, taskId: id, courseTab: 'homework' })
  }
  const [conditions, setConditions] = useState<FilterCondition[]>([])
  const [sort, setSort] = useState<{ key: 'title' | 'grade' | 'activity' | 'status'; descending: boolean } | null>(null)
  const allTasks = (statement.tasks ?? []).map(task => ({ ...task, status: task.status === 'Сдано' ? task.status : records[task.id]?.submittedAt ? 'На проверке' : records[task.id]?.savedAt || records[task.id]?.startedAt ? 'В процессе' : task.status } as GradeTask))
  const personallySkipped = (id: string) => { const task = academicTasks.find(task => task.id === id); return !!task && isHomeworkSkipped(task, records[id]) }
  const tasks = allTasks.filter(task => matchesFilters({ activity: task.activity, status: [task.status, ...(personallySkipped(task.id) ? ['Пропущено мной'] : [])] }, conditions))
  if (sort) tasks.sort((a, b) => {
    const left = a[sort.key], right = b[sort.key]
    if (left === null) return right === null ? 0 : 1
    if (right === null) return -1
    return (typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'ru')) * (sort.descending ? -1 : 1)
  })
  const topics = [...new Set(tasks.map(task => task.topic))]
  function reset() { setConditions([]) }
  function toggle(key: NonNullable<typeof sort>['key']) { setSort(current => ({ key, descending: current?.key === key ? !current.descending : false })) }
  return <>
    <div className="grades-toolbar"><FilterBuilder fields={[{ id: 'activity', label: 'Активность', options: filterOptions((statement.tasks ?? []).map(task => task.activity)) }, { id: 'status', label: 'Статус', options: filterOptions([...allTasks.map(task => task.status), 'Пропущено мной']) }]} conditions={conditions} onChange={setConditions} label="Фильтры заданий ведомости" /></div>
    <p className="sr-only" role="status">Заданий: {tasks.length}</p>
    {!tasks.length ? <Empty title={statement.tasks?.length ? 'Задания не найдены' : 'Нет данных по заданиям'} onReset={conditions.length > 0 ? reset : undefined}>{statement.tasks?.length ? 'Измени или сбрось фильтры.' : 'Оценки по заданиям появятся здесь.'}</Empty> : <>
      <div className="grades-table-shell grades-desktop"><Table className="grades-task-table"><caption className="sr-only">Набранные баллы: {statement.title}</caption><TableHeader><TableRow><TableHead scope="col">Тема</TableHead>{([['title', 'Название задания'], ['grade', 'Оценка'], ['activity', 'Активность'], ['status', 'Статус']] as const).map(([key, label]) => <TableHead key={key} scope="col" aria-sort={sort?.key === key ? sort.descending ? 'descending' : 'ascending' : 'none'}><Button variant="ghost" type="button" onClick={() => toggle(key)}>{label}<SortIndicator direction={sort?.key === key ? sort.descending ? 'desc' : 'asc' : null} /></Button></TableHead>)}</TableRow></TableHeader><TableBody>{tasks.map(task => <TableRow key={task.id}><TableCell>{task.topic}</TableCell><TableCell className="font-medium"><Button variant="link" className="h-auto p-0 whitespace-normal text-left justify-start text-foreground" onClick={() => openTask(task.id)}>{task.title}</Button></TableCell><TableCell>{<GradeValue value={task.grade} />}</TableCell><TableCell>{task.activity}</TableCell><TableCell><TaskStatus status={task.status} /><HomeworkPersonalControl taskId={task.id} /></TableCell></TableRow>)}</TableBody></Table></div>
      <div className="grades-mobile grades-topics">{topics.map(topic => <details key={topic} open className="grades-topic"><summary>{topic}<ChevronDown aria-hidden="true" /></summary><ul>{tasks.filter(task => task.topic === topic).map(task => <li key={task.id}><h3><Button variant="link" className="h-auto p-0 whitespace-normal text-left justify-start text-foreground" onClick={() => openTask(task.id)}>{task.title}</Button></h3><dl><div><dt>Оценка</dt><dd>{<GradeValue value={task.grade} />}</dd></div><div><dt>Активность</dt><dd>{task.activity}</dd></div><div><dt>Статус</dt><dd><TaskStatus status={task.status} /><HomeworkPersonalControl taskId={task.id} /></dd></div></dl></li>)}</ul></details>)}</div>
    </>}
  </>
}
export default function GradesWorkspace({ onOpenCourse }: { onOpenCourse: (id: string, enrollmentId?: string) => void }) {
  const [conditions, setConditions] = useState<FilterCondition[]>([])
  const [scope, setScope] = useState<AcademicScope>('semester')
  const [sort, setSort] = useState<Sort>(null)
  const { statementId: selectedId, gradeTab: detailTab } = useNavigation()
  const setSelectedId = (statementId: string | null) => navigate({ statementId })
  const setDetailTab = (gradeTab: string) => navigate({ gradeTab }, true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const listScroll = useRef(0)
  const lastOpened = useRef<string | null>(null)
  const statement = gradeStatements.find(item => item.id === selectedId)
  const heading = 'Ведомости'
  const base = gradeStatements.filter(item => academicScope(item) === scope)
  const semesters = [...new Set(base.flatMap(item => item.semester === null ? [] : [item.semester]))].sort()
  const visible = base.filter(item => matchesFilters({ semester: item.semester === null ? null : String(item.semester), format: item.format }, conditions))
  if (sort) visible.sort((a, b) => {
    const left = sort.key === 'grade' ? grade(a) : a[sort.key], right = sort.key === 'grade' ? grade(b) : b[sort.key]
    if (left === null) return right === null ? 0 : 1
    if (right === null) return -1
    return (typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'ru')) * (sort.descending ? -1 : 1)
  })
  useLayoutEffect(() => {
    if (selectedId) { if (scrollRef.current) scrollRef.current.scrollTop = 0; scrollRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }) }
    else if (scrollRef.current) {
      scrollRef.current.scrollTop = listScroll.current
      const buttons = scrollRef.current.querySelectorAll<HTMLButtonElement>(`[data-statement-id="${lastOpened.current}"]`)
      ;[...buttons].find(button => button.getClientRects().length && button.offsetWidth)?.focus({ preventScroll: true })
    }
  }, [selectedId])
  function open(item: GradeStatement) { listScroll.current = scrollRef.current?.scrollTop ?? 0; lastOpened.current = item.id; navigate({ gradeTab: 'formula', statementId: item.id }) }
  function reset() { setConditions([]) }
  function toggle(key: SortKey) { setSort(current => ({ key, descending: current?.key === key ? !current.descending : false })) }
  function grade(item: GradeStatement) { return item.formula?.length ? calculateGrade(item.formula).rounded : item.grade }
  return <TooltipProvider delayDuration={200}><div className="grades-surface" ref={scrollRef}><section className="page-container grades-page" data-layout="data" aria-label={statement ? undefined : 'Ведомости'} aria-labelledby={statement ? 'grades-title' : undefined}>
    <div className="gradebook-actions"><Button type="button" variant="outline" onClick={() => navigate({ section: 'Прогноз', studyTarget: statement?.courseId })}>Открыть прогноз</Button></div>
    {statement ? <>
      <header className="grades-heading"><Button variant="ghost" className="page-back-button" onClick={() => { setConditions([]); setScope(academicScope(statement)); setSelectedId(null) }}>Все ведомости</Button><h1 id="grades-title" tabIndex={-1}>{statement.title}</h1></header>
      <Tabs value={detailTab} onValueChange={setDetailTab}><TabsList aria-label="Разделы ведомости"><TabsTrigger value="formula">Формула оценки</TabsTrigger><TabsTrigger value="earned">Набранные баллы</TabsTrigger></TabsList><TabsContent value="formula" className="grades-tab"><Formula statement={statement} /></TabsContent><TabsContent value="earned" className="grades-tab"><Earned key={statement.id} statement={statement} /></TabsContent></Tabs>
      {statement.courseId ? <Button className="mt-6" variant="outline" onClick={() => onOpenCourse(statement.courseId!, statement.id)}>Открыть курс</Button> : null}
    </> : <>

      <Tabs value={scope} onValueChange={value => { setScope(value as AcademicScope); setConditions([]) }}><TabsList aria-label="Группировка курсов"><TabsTrigger value="semester">Курсы по семестрам</TabsTrigger><TabsTrigger value="outside">Курсы вне семестра</TabsTrigger><TabsTrigger value="archive">Архивные</TabsTrigger></TabsList><TabsContent value={scope} className="grades-tab">
        <div className="grades-toolbar"><FilterBuilder fields={[
          ...(scope !== 'outside' ? [{ id: 'semester', label: 'Семестр', options: semesters.map(value => ({ value: String(value), label: `${value} семестр` })) }] : []),
          { id: 'format', label: 'Формат', options: filterOptions(gradeStatements.flatMap(item => item.format ? [item.format] : [])) },
        ]} conditions={conditions} onChange={setConditions} label="Фильтры ведомостей" /></div>
        <p className="sr-only" role="status">Ведомостей: {visible.length}</p>
        {!visible.length ? <Empty title={base.length ? 'Ведомости не найдены' : 'Ведомостей пока нет'} onReset={base.length ? reset : undefined}>{base.length ? 'Измени или сбрось фильтры.' : 'В этом разделе пока нет ведомостей.'}</Empty> : <>
          <div className="grades-table-shell grades-desktop"><Table className="grades-catalog-table"><caption className="sr-only">{heading}</caption><TableHeader><TableRow>{([['title', 'Название'], ['grade', 'Оценка'], ...(scope !== 'outside' ? [['semester', 'Семестр']] : []), ['format', 'Формат']] as [SortKey, string][]).map(([key, label]) => <TableHead key={key} scope="col" aria-sort={sort?.key === key ? sort.descending ? 'descending' : 'ascending' : 'none'}><Button type="button" variant="ghost" onClick={() => toggle(key)}>{label}<SortIndicator direction={sort?.key === key ? sort.descending ? 'desc' : 'asc' : null} /></Button></TableHead>)}</TableRow></TableHeader><TableBody>{visible.map(item => <TableRow key={item.id}><TableCell><a href={`?section=Ведомости&statement=${encodeURIComponent(item.id)}`} data-statement-id={item.id} className="grades-title-link" onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); open(item) }}>{item.title}<ChevronRight aria-hidden="true" /></a></TableCell><TableCell>{<GradeValue value={grade(item)} />}</TableCell>{scope !== 'outside' ? <TableCell>{item.semester}</TableCell> : null}<TableCell>{item.format ? <Badge variant="secondary">{item.format}</Badge> : '—'}</TableCell></TableRow>)}</TableBody></Table></div>
          <div className="grades-mobile grades-cards">{visible.map(item => <Card key={item.id} className="grades-statement-card"><button type="button" data-statement-id={item.id} onClick={() => open(item)}><span className="grades-card-title">{item.title}<ChevronRight aria-hidden="true" /></span><span className="grades-card-meta">{scope !== 'outside' ? <span>{item.semester} семестр</span> : null}{item.format ? <Badge variant="secondary">{item.format}</Badge> : null}</span><span className="grades-card-score">Оценка<strong>{<GradeValue value={grade(item)} />}</strong></span></button></Card>)}</div>
        </>}
      </TabsContent></Tabs>
    </>}
  </section></div></TooltipProvider>
}
