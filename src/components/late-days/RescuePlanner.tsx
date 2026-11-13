import { NumberStepper } from '@/components/ui/number-stepper'
import { Checkbox } from '@/components/ui/checkbox'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { useState } from 'react'
import { academicTasks, type AcademicTask } from '@/data/academic-data'
import { getCourse } from '@/data/course-catalog'
import { currentLateDaysSemester, shiftDeadline } from '@/data/late-days'
import { burningTasks, lateDaysReason, semesterForTask, type LateDaysPlanItem } from '@/lib/late-days'
import { useLateDays } from '@/components/LateDaysProvider'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { navigate } from '@/hooks/use-navigation'
import { isHomework } from '@/lib/academic-presentation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
type RescueStrategy = 'burning' | 'all-one' | 'manual' | 'distribute'
export default function RescuePlanner({ planId, strategy = 'burning', embedded = false }: { planId: string; strategy?: RescueStrategy; embedded?: boolean }) {
  const { state, balance, deadline, apply } = useLateDays()
  const records = useHomeworkRecords()
  const { formatDateTime } = useDisplayFormats()
  const tasks = academicTasks.filter(isHomework)
  const eligible = tasks.filter(task => !lateDaysReason(task, state, records)).sort((a, b) => deadline(a).localeCompare(deadline(b)) || a.id.localeCompare(b.id))
  const burning = burningTasks(state, records)
  const exclusions = tasks.filter(task => !eligible.some(item => item.id === task.id))
  function proposal(mode: RescueStrategy): LateDaysPlanItem[] {
    const source = mode === 'burning' ? burning : eligible
    return (mode === 'manual' ? [] : mode === 'distribute' ? source.slice(0, balance.remaining) : source).map(task => ({ taskId: task.id, days: 1, expectedDeadline: deadline(task) }))
  }
  const [plan, setPlan] = useState<LateDaysPlanItem[]>(() => proposal(strategy))
  const [review, setReview] = useState(false)
  const [error, setError] = useState('')
  const completed = state.operations.filter(item => item.batchId === planId)
  const cost = plan.reduce((sum, item) => sum + item.days, 0)
  const badDays = plan.some(item => !Number.isSafeInteger(item.days) || item.days < 1 || item.days > 366)
  const stale = plan.some(item => !eligible.some(task => task.id === item.taskId) || deadline(item.taskId) !== item.expectedDeadline)
  const valid = plan.length > 0 && cost <= balance.remaining && !badDays && !stale
  function choose(mode: RescueStrategy) { setPlan(proposal(mode)); setError('') }
  function select(task: AcademicTask, checked: boolean) { setPlan(previous => checked ? [...previous, { taskId: task.id, days: 1, expectedDeadline: deadline(task) }] : previous.filter(item => item.taskId !== task.id)); setError('') }
  function days(taskId: string, amount: number) { setPlan(previous => previous.map(item => item.taskId === taskId ? { ...item, days: amount } : item)); setError('') }
  if (completed.length) return <section className="late-days-rescue-result" role="status"><h3>Готово! Дедлайны перенесены</h3><p>Перенесли заданий: {completed.length}. Потратили {completed.reduce((sum, item) => sum + item.days, 0)} Late Days, осталось {balance.remaining}. Теперь можно заняться самими заданиями.</p><ul>{completed.map(item => <li key={item.id}><strong>{academicTasks.find(task => task.id === item.taskId)?.title}</strong><span>{formatDateTime(item.newDeadline, true)} МСК</span></li>)}</ul><Button variant="outline" onClick={() => navigate({ section: 'Домашки' })}>Открыть домашки</Button></section>
  return <section className={`late-days-rescue ${embedded ? 'gen-ui' : ''}`} aria-label="Спасти дедлайны">
    <header className="late-days-rescue-heading"><h3>Спасти дедлайны</h3><p>Доступно: <strong><AnimatedNumber value={balance.remaining} minDigits={2} /> Late Days</strong></p></header>
    <p className="late-days-muted">Ближайшие 48 часов: {burning.length} подходящих заданий. Выбери переносы и проверь расход.</p>
    <div className="late-days-strategies"><Button variant="outline" size="sm" onClick={() => choose('all-one')}>Все подходящие +1 день</Button><Button variant="outline" size="sm" onClick={() => choose('burning')}>Перенести всё горящее</Button><Button variant="ghost" size="sm" onClick={() => choose('manual')}>Выбрать вручную</Button><Button variant="ghost" size="sm" onClick={() => choose('distribute')}>Распределить доступные дни</Button></div>
    {eligible.length ? <div className="late-days-plan-scroll" tabIndex={0} role="region" aria-label="Задания для переноса"><ul className="late-days-plan-list">{eligible.map(task => {
      const item = plan.find(item => item.taskId === task.id)
      const next = item && Number.isSafeInteger(item.days) && item.days > 0 && item.days <= 366 ? shiftDeadline(item.expectedDeadline, item.days) : deadline(task)
      return <li key={task.id} data-plan-task-id={task.id}><label className="late-days-plan-task"><Checkbox checked={!!item} onChange={event => select(task, event.target.checked)} /><span><strong>{task.title}</strong><small>{getCourse(task.courseId).title}</small><span>Сейчас: {formatDateTime(deadline(task), true)} МСК</span></span></label>
        <div className="late-days-plan-controls"><div className="late-days-step-field-inline"><span aria-hidden="true">Дней</span><NumberStepper aria-label={`Дней переноса: ${task.title}`} min={1} max={balance.remaining} disabled={!item} value={item ? item.days || '' : ''} onValueChange={value => days(task.id, Number(value))} /></div><div className="late-days-quick" aria-label={`Быстрый перенос: ${task.title}`}>{[1, 2, 3].map(amount => <Button variant="ghost" size="sm" key={amount} disabled={!item} aria-pressed={item?.days === amount} onClick={() => days(task.id, amount)}>+{amount}</Button>)}</div><span className="late-days-plan-date">Новый: <time dateTime={next}>{formatDateTime(next, true)} МСК</time></span></div>
      </li>
    })}</ul></div> : <div className="late-days-no-tasks"><p>{balance.remaining ? 'Подходящих заданий для переноса сейчас нет.' : 'Late Days закончились. Перенос сейчас недоступен.'}</p><Button variant="outline" onClick={() => navigate({ section: 'Домашки' })}>Посмотреть домашки</Button></div>}
    <details className="late-days-excluded"><summary>Исключённые задания: {exclusions.length}</summary><ul>{exclusions.map(task => <li key={task.id}><strong>{task.title}</strong><span>{lateDaysReason(task, state, records) ?? (semesterForTask(task)?.id !== currentLateDaysSemester.id ? 'Другой семестр' : 'Недоступно для переноса')}</span></li>)}</ul></details>
    <div className="late-days-plan-summary" aria-live="polite"><span>Выбрано: <AnimatedNumber value={plan.length} minDigits={2} /></span><span>Расход: <AnimatedNumber value={cost} minDigits={2} /> Late Days</span><strong>Останется: {cost <= balance.remaining && !badDays ? <AnimatedNumber value={balance.remaining - cost} minDigits={2} /> : '—'}</strong></div>
    {(error || cost > balance.remaining || badDays || stale) ? <p className="text-sm text-destructive" role="alert">{error || (stale ? 'Данные изменились. Выбери «Перенести всё горящее», чтобы обновить план.' : badDays ? 'Укажи целое количество дней от 1 до 366.' : 'Не хватает Late Days. Измени план или распредели доступные дни.')}</p> : null}
    <Button className="late-days-plan-submit" disabled={!valid} onClick={() => { setError(''); setReview(true) }}>Перенести выбранные дедлайны</Button>
    <Dialog open={review} onOpenChange={setReview}><DialogContent className="late-days-dialog late-days-confirmation"><DialogHeader><DialogTitle>Подтвердить перенос</DialogTitle><DialogDescription>Переносим все выбранные задания вместе. Проверь новые сроки и расход Late Days.</DialogDescription></DialogHeader>
      <ul className="late-days-confirmation-list">{plan.map(item => <li key={item.taskId}><strong>{academicTasks.find(task => task.id === item.taskId)?.title}</strong><span>{formatDateTime(shiftDeadline(item.expectedDeadline, item.days), true)} МСК · +{item.days} дн.</span></li>)}</ul>
      <p>Будет потрачено: <strong>{cost}</strong>. Останется: <strong>{balance.remaining - cost}</strong>.</p>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <DialogFooter><Button variant="outline" onClick={() => setReview(false)}>Вернуться к плану</Button><Button disabled={!valid} onClick={() => { const result = apply(plan, planId); if (result.ok) setReview(false); else setError(result.error ?? 'Не удалось применить план.') }}>Подтвердить перенос</Button></DialogFooter>
    </DialogContent></Dialog>
  </section>
}
