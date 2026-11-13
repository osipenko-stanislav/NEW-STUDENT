import { AnimatedNumber } from '@/components/ui/animated-number'
import { NumberStepper } from '@/components/ui/number-stepper'
import { useMicroFeedback } from '@/hooks/use-micro-feedback'
import { useRef, useState } from 'react'
import { academicTasks } from '@/data/academic-data'
import { getCourse } from '@/data/course-catalog'
import { shiftDeadline } from '@/data/late-days'
import { lateDaysReason, semesterForTask } from '@/lib/late-days'
import { useHomeworkRecords } from '@/hooks/use-homework'
import { useLateDays } from '@/components/LateDaysProvider'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { Button } from '@/components/ui/button'
import { CalendarDatePicker } from '@/components/ui/calendar-date-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
export default function LateDaysDialog({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const task = academicTasks.find(item => item.id === taskId)!
  const { state, balance, deadline, apply } = useLateDays()
  const records = useHomeworkRecords()
  const { formatDateTime } = useDisplayFormats()
  const [before] = useState(() => deadline(task))
  const [batchId] = useState(() => crypto.randomUUID())
  const [value, setValue] = useState('1')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const days = Number(value)
  const valid = Number.isSafeInteger(days) && days > 0 && days <= 366
  const next = valid ? shiftDeadline(before, days) : before
  const preview = useRef<HTMLElement>(null)
  useMicroFeedback(preview, next)
  const reason = lateDaysReason(task, state, records)
  function dateChange(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setValue(''); return }
    setValue(String(Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${before.slice(0, 10)}T12:00:00Z`)) / 86400000)))
    setError('')
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose() }}><DialogContent className="late-days-dialog" aria-describedby="late-days-transfer-description">
    <DialogHeader><DialogTitle>{done ? 'Дедлайн перенесён' : 'Перенести дедлайн'}</DialogTitle><DialogDescription id="late-days-transfer-description">{task.title} · {getCourse(task.courseId).title}</DialogDescription></DialogHeader>
    {done ? <div className="late-days-success" role="status"><p>Новый дедлайн: <strong>{formatDateTime(deadline(task))} МСК</strong></p><p>Потратили {days} Late Days. Осталось {balance.remaining}.</p><Button onClick={onClose}>Готово</Button></div> : <>
      <dl className="late-days-transfer-facts"><div><dt>Исходный дедлайн</dt><dd>{formatDateTime(task.dueAt)} МСК</dd></div><div><dt>Текущий дедлайн</dt><dd>{formatDateTime(before)} МСК</dd></div><div><dt>Доступно Late Days</dt><dd>{balance.remaining}</dd></div></dl>
      <p className="late-days-muted">1 Late Day = 1 календарный день. Время сдачи сохраняется.</p>
      <div className="late-days-date-controls"><label htmlFor="late-days-date">Новая дата<CalendarDatePicker id="late-days-date" label="Новый дедлайн" max={semesterForTask(task)?.endsAt} min={shiftDeadline(before, 1).slice(0, 10)} value={valid ? next.slice(0, 10) : ''} onValueChange={dateChange} /></label><div className="late-days-step-field"><label htmlFor="late-days-count">Количество дней</label><NumberStepper id="late-days-count" min={1} max={balance.remaining} value={value} onValueChange={value => { setValue(value); setError('') }} /></div></div>
      <div className="late-days-quick" aria-label="Быстрый перенос">{[1, 2, 3].map(amount => <Button key={amount} variant="outline" size="sm" aria-pressed={days === amount} onClick={() => { setValue(String(amount)); setError('') }}>+{amount} {amount === 1 ? 'день' : 'дня'}</Button>)}</div>
      <div className="late-days-preview" aria-live="polite"><p>Новый дедлайн: <strong ref={preview}>{formatDateTime(next)} МСК</strong></p><p>Будет потрачено: {valid ? <AnimatedNumber value={days} minDigits={2} /> : '—'}. Останется: {valid && days <= balance.remaining ? <AnimatedNumber value={balance.remaining - days} minDigits={2} /> : '—'}.</p></div>
      {(error || reason || !valid || days > balance.remaining) ? <p className="text-sm text-destructive" role="alert">{error || reason || (!valid ? 'Выбери дату позже текущего дедлайна или укажи целое количество дней.' : 'Не хватает Late Days. Уменьши перенос.')}</p> : null}
      <DialogFooter><Button variant="outline" onClick={onClose}>Отмена</Button><Button disabled={!valid || days > balance.remaining || !!reason} onClick={() => {
        const result = apply([{ taskId, days, expectedDeadline: before }], batchId)
        if (result.ok) setDone(true); else setError(result.error ?? 'Не удалось перенести дедлайн.')
      }}>Перенести дедлайн</Button></DialogFooter>
    </>}
  </DialogContent></Dialog>
}
