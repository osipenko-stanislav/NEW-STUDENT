import { useLayoutEffect, useRef, useState } from 'react'
import { Hourglass, ArrowRight } from 'lucide-react'
import { useLateDays } from '@/components/LateDaysProvider'
import { currentLateDaysSemester, lateDaysSemesters } from '@/data/late-days'
import { academicTasks } from '@/data/academic-data'
import { getCourse } from '@/data/course-catalog'
import { lateDaysBalance } from '@/lib/late-days'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { navigate } from '@/hooks/use-navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import LateDaysChart from './LateDaysChart'
export default function LateDaysWorkspace() {
  const { state } = useLateDays()
  const [semesterId, setSemesterId] = useState(currentLateDaysSemester.id)
  const semester = lateDaysSemesters.find(item => item.id === semesterId)!
  const balance = lateDaysBalance(state, semester)
  const { formatDateTime } = useDisplayFormats()
  const heading = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
  const operations = state.operations.filter(item => item.semesterId === semester.id).slice().reverse()
  return <section className="page-container late-days-page" data-layout="workspace" aria-labelledby="late-days-title">
    <header className="late-days-page-heading"><h1 id="late-days-title" tabIndex={-1} ref={heading}>Late Days</h1><Select value={semesterId} onValueChange={setSemesterId}><SelectTrigger aria-label="Семестр Late Days"><SelectValue /></SelectTrigger><SelectContent>{lateDaysSemesters.map(item => <SelectItem key={item.id} value={item.id}>{item.name}{item.current ? '' : ' · Архив'}</SelectItem>)}</SelectContent></Select></header>
    {!semester.current ? <p className="late-days-muted">Архивный семестр · Только просмотр</p> : null}
    <dl className="late-days-metrics"><div><dt>Осталось</dt><dd className="late-days-primary-number" key={balance.remaining}>{balance.remaining}</dd></div><div><dt>Использовано</dt><dd>{balance.used}</dd></div><div><dt>Лимит</dt><dd>{balance.limit}</dd></div></dl>
    <div className="late-days-meter" role="meter" aria-label="Использовано Late Days" aria-valuemin={0} aria-valuemax={balance.limit} aria-valuenow={balance.used}><span style={{ width: `${balance.used / balance.limit * 100}%` }} /></div>
    <section className="late-days-analytics"><h2>Расход по месяцам</h2><p className="late-days-muted">Завершённые месяцы — на конец месяца, текущий — на сегодня</p><LateDaysChart key={semester.id} semester={semester} /></section>
    <section className="late-days-history"><h2>История операций</h2>{operations.length ? <ul>{operations.map(operation => {
      const task = academicTasks.find(item => item.id === operation.taskId)!
      return <li key={operation.id}><button className="late-days-operation" onClick={() => navigate({ section: 'Курсы', courseId: task.courseId, taskId: task.id, lessonId: null, materialId: null, courseTab: 'homework' })}>
        <Hourglass aria-hidden="true" /><span className="late-days-operation-copy"><strong>{task.title}</strong><span>{getCourse(task.courseId).title}</span><span>Исходный: {formatDateTime(operation.originalDeadline, true)}</span><span className="late-days-operation-dates"><time dateTime={operation.beforeDeadline}>{formatDateTime(operation.beforeDeadline, true)}</time><ArrowRight aria-hidden="true" /><time dateTime={operation.newDeadline}>{formatDateTime(operation.newDeadline, true)}</time></span><time dateTime={operation.at}>{formatDateTime(operation.at, true)} · {operation.type === 'debit' ? 'Списание' : operation.type === 'refund' ? 'Возврат' : 'Корректировка'}</time></span><span className="late-days-operation-amount">{operation.type === 'refund' || operation.days < 0 ? '+' : '−'}{Math.abs(operation.days)} дн.</span>
      </button></li>
    })}</ul> : <EmptyState icon={Hourglass} title="Операций пока нет" description="Здесь появится история переносов." />}</section>
    <details className="late-days-rules"><summary>Как работают Late Days</summary><p>1 Late Day — 1 календарный день отсрочки. Время сдачи сохраняется. Перенос доступен для несданных домашних работ текущего семестра до истечения дедлайна. После запуска таймера срок менять нельзя. Подтверждённые переносы нельзя отменить самостоятельно.</p></details>
    {semester.current ? <Button variant="outline" onClick={() => navigate({ section: 'Домашки' })}>Открыть домашки</Button> : null}
  </section>
}
