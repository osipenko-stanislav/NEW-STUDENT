import { HomeworkPersonalStatus } from './HomeworkPersonalControl'
import HomeworkDiscussion from './HomeworkDiscussion'
import { actionStatus } from '@/lib/action-status'
import { AnimatePresence, m } from 'motion/react'
import { useAppMotion } from '@/components/MotionProvider'
import { recipe, recipeTransition } from '@/lib/motion-recipes'
import { GradeValue } from '@/components/ui/grade-value'
import { FeedbackButton, AsyncButton } from '@/components/ui/feedback-button'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { AnimatedStatus } from '@/components/ui/animated-status'

import TaskDeadline from '@/components/late-days/TaskDeadline'
import AcademicMaterialLink from '@/components/AcademicMaterialLink'
import { useEffect, useRef, useState } from 'react'
import { BookOpen, ChevronRight, Clock3, Download, History, Paperclip, Save, X } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import PageBackButton from '@/components/PageBackButton'
import FileIcon from '@/components/FileIcon'
import HomeworkModeBadge from './HomeworkModeBadge'
import { useMaterialSync } from '@/components/MaterialSyncProvider'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { navigate } from '@/hooks/use-navigation'
import { homeworkEvent, updateHomework, useHomeworkRecords } from '@/hooks/use-homework'
import { emptyHomework, homeworkStatus, remainingHomeworkTime, validSolutionLink, type HomeworkFile } from '@/lib/homework-storage'
import { deleteMaterialFiles, putMaterialFiles } from '@/lib/material-files'
import { taskStatusLabels, taskStatusVariants } from '@/lib/academic-presentation'
import { academicMaterials, enrollments, type AcademicTask } from '@/data/academic-data'
import { getCourse } from '@/data/course-catalog'
import { lessonsForCourse } from '@/data/course-curricula'

const fileLimit = 1024 ** 3
export default function CourseHomework({ task }: { task: AcademicTask }) {
  const { effectiveIntensity, spatialMotion } = useAppMotion()
  const records = useHomeworkRecords()
  const record = records[task.id] ?? emptyHomework()
  const status = homeworkStatus(task, record)
  const archived = enrollments.find(item => item.id === task.enrollmentId)?.archived ?? false
  const course = getCourse(task.courseId)
  const lessons = lessonsForCourse(task.courseId)
  const topicIndex = Math.max(0, Number(task.topic.match(/^Тема (\d+)/)?.[1] ?? 1) - 1)
  const related = lessons.slice(topicIndex, topicIndex + 2)
  const materials = academicMaterials.filter(item => task.materialIds.includes(item.id))
  const [link, setLink] = useState(record.link)
  const [files, setFiles] = useState<HomeworkFile[]>(record.files)
  const staged = useRef(new Map<string, File>())
  const [history, setHistory] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(Date.now)
  const heading = useRef<HTMLHeadingElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const { formatDateTime } = useDisplayFormats()
  const { exportMaterial } = useMaterialSync()
  const timed = !!task.timeLimitMinutes
  const remaining = timed ? remainingHomeworkTime(record, task.timeLimitMinutes!, now) : 0
  const finished = status === 'accepted' || status === 'submitted'
  const expired = timed && !!record.startedAt && remaining === 0
  const canEdit = !archived && !finished && !expired && (!timed || !!record.startedAt)
  const changed = link.trim() !== record.link || JSON.stringify(files) !== JSON.stringify(record.files)
  const hasSolution = !!(link.trim() || files.length)
  const hours = Math.floor(remaining / 3600000)
  const minutes = Math.floor(remaining / 60000) % 60
  const seconds = Math.floor(remaining / 1000) % 60
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
  useEffect(() => {
    if (!timed || !record.startedAt || finished || expired) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [timed, record.startedAt, finished, expired])
  function store(update: Parameters<typeof updateHomework>[1]) {
    if (archived) return false
    const saved = updateHomework(task.id, update)
    if (!saved) setError('Не удалось сохранить изменения. Проверь свободное место и повтори попытку.')
    return saved
  }
  function attach(selected: File[]) {
    setError(''); setNotice('')
    const additions = selected.filter(file => !files.some(existing => existing.name === file.name && existing.size === file.size))
    if (files.reduce((sum, file) => sum + file.size, 0) + additions.reduce((sum, file) => sum + file.size, 0) > fileLimit) {
      actionStatus.report({ key: `homework-files:${task.id}`, label: 'Не удалось добавить файлы', detail: 'Общий размер не должен превышать 1 ГБ' }, false)
      setError('Общий размер файлов не должен превышать 1 ГБ.'); return
    }
    const added = additions.map(file => {
      const id = `homework-${crypto.randomUUID()}`
      staged.current.set(id, file)
      return { id, name: file.name, size: file.size, type: file.type }
    })
    setFiles(current => [...current, ...added])
  }
  async function save(submit = false) {
    if (busy || !canEdit || !hasSolution) return
    setError(''); setNotice('')
    if (!validSolutionLink(link)) { actionStatus.report({ key: `homework:${task.id}`, label: 'Не удалось сохранить решение', detail: 'Проверь ссылку на решение' }, false); setError('Укажи полную ссылку, которая начинается с https:// или http://.'); return }
    setBusy(true)
    const operation = actionStatus.begin({ key: `homework:${task.id}`, label: submit ? 'Отправляем решение' : 'Сохраняем решение', detail: task.title })
    const additions = files.filter(file => staged.current.has(file.id)).map(file => ({ id: file.id, blob: staged.current.get(file.id)! }))
    try {
      if (additions.length) await putMaterialFiles(additions)
      if (timed && remainingHomeworkTime(record, task.timeLimitMinutes!) === 0) throw new Error('expired')
      const saved = store(current => ({ ...current, link: link.trim(), files, savedAt: Date.now(), ...(submit ? { submittedAt: Date.now() } : {}), events: [...current.events, homeworkEvent(submit ? 'Решение отправлено на проверку' : 'Решение сохранено')] }))
      actionStatus.finish(operation, saved ? submit ? 'Решение отправлено на проверку' : 'Решение сохранено' : 'Не удалось сохранить решение', saved, task.title)
      if (saved) {
        staged.current.clear()
        const removed = record.files.filter(file => !files.some(item => item.id === file.id)).map(file => file.id)
        void deleteMaterialFiles(removed).catch(() => {})
        setNotice(submit ? 'Решение отправлено на проверку.' : 'Решение сохранено.')
      } else if (additions.length) await deleteMaterialFiles(additions.map(file => file.id))
    } catch {
      if (additions.length) await deleteMaterialFiles(additions.map(file => file.id)).catch(() => {})
      actionStatus.finish(operation, 'Не удалось сохранить решение', false, task.title)
      setError('Не удалось сохранить решение. Проверь файлы и повтори попытку.')
    } finally { setBusy(false); setNow(Date.now()) }
  }
  const program = () => navigate({ taskId: null, lessonId: null, courseTab: 'homework', courseEnrollmentId: task.enrollmentId })
  return <div className="page-container homework-page" data-layout="reading" data-with-rail>
    <header className="homework-heading">
      <PageBackButton />
      <div className="flex flex-wrap items-center gap-2 mb-3">{archived ? <Badge variant="secondary">Архивное задание</Badge> : null}<Badge className="homework-status-badge" variant={expired && !finished ? 'danger' : taskStatusVariants[status]}><AnimatedStatus state={expired && !finished ? 'expired' : status} label={expired && !finished ? 'Время вышло' : taskStatusLabels[status]} choices={[...Object.values(taskStatusLabels), 'Время вышло']} /></Badge><HomeworkModeBadge minutes={task.timeLimitMinutes} /><HomeworkPersonalStatus taskId={task.id} /></div>
      <h1 ref={heading} tabIndex={-1} className="text-2xl font-semibold leading-tight outline-none">{task.title}</h1>
      <Button variant="link" className="h-auto p-0 mt-2 text-muted-foreground whitespace-normal text-left" onClick={program}>{course.title}</Button>
    </header>
    <aside className="homework-sidebar" aria-label="Сроки и результат задания">
      {timed ? <Card size="sm"><CardHeader><h2 className="text-sm font-medium flex gap-2 items-center"><Clock3 className="size-4" aria-hidden="true" />Время на выполнение</h2></CardHeader><CardContent className="space-y-3">{record.startedAt && !finished ? <><p className="text-3xl font-semibold tabular-nums" aria-label="Осталось времени"><AnimatedNumber value={hours} minDigits={2} />:<AnimatedNumber value={minutes} minDigits={2} />:<AnimatedNumber value={seconds} minDigits={2} /></p><div className="homework-timer-track" aria-hidden="true"><span style={{ width: `${remaining / (task.timeLimitMinutes! * 60000) * 100}%` }} /></div><p className="text-xs text-muted-foreground">{expired ? record.savedAt ? 'Сохраненное решение отправлено на проверку.' : 'Время вышло. Решение не сохранено.' : 'После окончания таймера отправим сохраненное решение на проверку.'}</p></> : <><p className="text-2xl font-semibold">{task.timeLimitMinutes! / 60} часа</p><p className="text-xs text-muted-foreground">{finished ? 'Работа завершена.' : 'Таймер начнется после нажатия «Начать задание». Остановить его нельзя.'}</p>{!finished ? <Button className="w-full" onClick={() => { if (store(current => ({ ...current, startedAt: Date.now(), events: [...current.events, homeworkEvent('Задание начато. Таймер запущен')] }))) setNow(Date.now()) }}>Начать задание</Button> : null}</>}</CardContent></Card> : null}
      <Card className="homework-meta-surface homework-results-island" aria-label="Результат и сроки">{task.grade !== null ? <div className="homework-grade-metric"><span className="text-sm text-muted-foreground">Твоя оценка</span><strong className="text-3xl font-semibold mt-1"><GradeValue value={task.grade} /> <span className="text-sm font-normal text-muted-foreground">из 10</span></strong></div> : null}<dl className="homework-meta-list space-y-4 text-sm"><div><dt className="text-muted-foreground">Максимальный балл</dt><dd className="font-medium mt-1">10</dd></div><div><dt className="text-muted-foreground">Дедлайн</dt><dd className="font-medium mt-1"><TaskDeadline task={task} /></dd></div></dl></Card>
      <Button variant="outline" className="w-full justify-between" onClick={() => setHistory(true)}>История решения<History className="size-4" aria-hidden="true" /></Button>
    </aside>
    <main className="homework-content">
      <section className="homework-brief-surface reading-prose space-y-6"><section><h2 className="text-lg font-semibold mb-3">Условие задания</h2><p className="text-sm leading-6">{task.description}</p>{expanded ? <div className="mt-4 space-y-2 text-sm leading-6"><h3 className="font-medium">Что должно быть в решении</h3><ol className="list-decimal pl-5 space-y-1"><li>Ход решения с объяснением выбранного метода.</li><li>Проверка результата на примерах.</li><li>Выводы по выполненной работе.</li></ol><p>Прикрепи файлы или ссылку на решение. Проверь, что преподаватель сможет открыть ссылку.</p></div> : null}<Button variant="link" className="h-auto px-0 mt-3" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'Свернуть условие' : 'Показать полностью'}</Button></section>
        {materials.length ? <section><h2 className="text-sm font-semibold mb-3">Материалы задания</h2><ul className="space-y-2">{materials.map(material => <li key={material.id} className="homework-resource"><AcademicMaterialLink material={material} className="flex min-w-0 flex-1 items-center gap-3" ><FileIcon name={material.title} size="compact" /><span className="min-w-0 text-sm break-words">{material.title}<small className="block text-muted-foreground">{material.sizeLabel}</small></span></AcademicMaterialLink><AsyncButton size="icon" variant="ghost" aria-label={`Экспортировать материал: ${material.title}`}  label="Экспортировать" loadingLabel="Экспортируем…" successLabel="Готово" errorLabel="Повторить" icon={<Download aria-hidden="true" />} action={() => exportMaterial(material.id)} /></li>)}</ul></section> : null}
        <section><h2 className="text-sm font-semibold mb-3">Связанные лекции</h2><ul className="space-y-2">{related.map(lesson => <li key={lesson.id}><Button variant="outline" className="homework-lecture" onClick={() => navigate({ taskId: null, lessonId: lesson.id, originBlockId: lesson.blockId })}><BookOpen aria-hidden="true" /><span>{lesson.title}</span><ChevronRight className="ml-auto shrink-0" aria-hidden="true" /></Button></li>)}</ul></section>
      </section>
      <section className="homework-solution-surface"><header className="homework-section-header"><h2 className="text-lg font-semibold">Решение</h2></header><div>
        {finished ? <div className="space-y-3 text-sm"><p>{status === 'accepted' ? 'Работа проверена. Результат учтен в ведомости курса.' : 'Решение отправлено на проверку. Результат появится после проверки.'}</p>{record.link ? <a href={record.link} target="_blank" rel="noreferrer" className="underline break-all">{record.link}</a> : null}{record.files.length ? <ul className="space-y-2">{record.files.map(file => <li key={file.id} className="homework-resource"><FileIcon name={file.name} size="compact" /><span className="text-sm break-all">{file.name}</span></li>)}</ul> : null}<Button variant="outline" onClick={() => navigate({ taskId: null, courseTab: 'grades', lessonId: null })}>Ведомость по курсу</Button></div> : timed && !record.startedAt ? <p className="text-sm text-muted-foreground">Нажми «Начать задание», чтобы запустить таймер. Затем добавь решение.</p> : expired ? <p className="text-sm text-muted-foreground">Время на выполнение закончилось.</p> : <form className="space-y-4" onSubmit={event => { event.preventDefault(); void save() }}>
          <div><label htmlFor="homework-link" className="text-sm font-medium">Ссылка на решение</label><Input id="homework-link" className="mt-2" type="url" placeholder="https://" value={link} disabled={busy} onChange={event => { setLink(event.target.value); setNotice('') }} /></div>
          <div><label className="text-sm font-medium" htmlFor="homework-files">Файлы решения</label><input ref={input} id="homework-files" type="file" multiple className="sr-only" disabled={busy || !canEdit} onChange={event => { attach(Array.from(event.target.files ?? [])); event.target.value = '' }} /><div className={`homework-dropzone ${dragging ? 'is-dragging' : ''}`} onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (!busy && canEdit) attach(Array.from(event.dataTransfer.files)) }}><Paperclip className="size-4" aria-hidden="true" /><Button type="button" variant="link" disabled={busy} onClick={() => input.current?.click()}>Выбрать файлы</Button><span className="text-sm text-muted-foreground">или перетащи их сюда</span></div><p className="text-xs text-muted-foreground mt-2">Любой формат, общий размер до 1 ГБ</p>{files.length ? <ul className="space-y-2 mt-3"><AnimatePresence initial={false}>{files.map(file => <m.li key={file.id} layout={spatialMotion ? 'position' : false} initial={{ opacity: 0, y: recipe('file', effectiveIntensity).distance }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -recipe('file', effectiveIntensity).distance, transition: recipeTransition('file', effectiveIntensity, true) }} transition={recipeTransition('file', effectiveIntensity)} className="homework-resource"><FileIcon name={file.name} size="compact" /><span className="text-sm break-all flex-1">{file.name}</span><Button type="button" size="icon" variant="ghost" disabled={busy} aria-label={`Убрать файл: ${file.name}`} onClick={() => { staged.current.delete(file.id); setFiles(current => current.filter(item => item.id !== file.id)); setNotice('') }}><X aria-hidden="true" /></Button></m.li>)}</AnimatePresence></ul> : null}</div>
          <div className="flex flex-wrap items-center gap-3"><FeedbackButton type="submit" state={busy ? 'loading' : error ? 'error' : notice === 'Решение сохранено.' ? 'success' : 'idle'} label="Сохранить решение" loadingLabel="Сохраняем…" successLabel="Решение сохранено" errorLabel="Повторить сохранение" icon={<Save aria-hidden="true" />} disabled={busy || !hasSolution || !changed} />{!timed ? <Button type="button" variant="outline" disabled={busy || !hasSolution} onClick={() => void save(true)}>Отправить на проверку</Button> : null}</div><p className="text-xs text-muted-foreground">{timed ? 'Можно менять сохраненное решение до конца таймера. После — отправим его на проверку.' : 'Сохрани решение, чтобы вернуться к нему позже, или отправь на проверку.'}</p>
        </form>}
        {record.savedAt ? <p className="text-xs text-muted-foreground mt-4">Сохранено: {formatDateTime(record.savedAt)} МСК</p> : null}
        {error ? <p className="text-sm text-destructive mt-3" role="alert">{error}</p> : null}
      </div></section>
      <HomeworkDiscussion key={task.id} taskId={task.id} comments={record.comments} archived={archived} />
    </main>
    <Sheet open={history} onOpenChange={setHistory}><SheetContent className="w-full sm:max-w-md"><SheetHeader><SheetTitle>История решения</SheetTitle><SheetDescription>{task.title}</SheetDescription></SheetHeader><ol className="homework-history mt-6">{[...record.events, ...(!record.events.length && finished ? [{ id: 'original-result', at: Date.parse(task.dueAt), text: status === 'accepted' ? `Работа проверена. Оценка: ${task.grade} из 10` : 'Решение отправлено на проверку' }] : [])].reverse().map(event => <li key={event.id}><p className="font-medium text-sm">{event.text}</p><time className="text-xs text-muted-foreground">{formatDateTime(event.at)} МСК</time></li>)}</ol>{!record.events.length && !finished ? <p className="mt-6 text-sm text-muted-foreground">Здесь появятся начало работы, сохранения и результаты проверки.</p> : null}</SheetContent></Sheet>
  </div>
}
