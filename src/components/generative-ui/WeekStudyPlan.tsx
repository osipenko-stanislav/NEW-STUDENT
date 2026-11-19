import HomeworkPersonalControl from '@/components/courses/HomeworkPersonalControl'
import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { academicMaterials, academicTasks } from '@/data/academic-data'
import { navigate } from '@/hooks/use-navigation'
import { dayStudyLoad, type PersonalStudyBlock } from '@/lib/week-plan'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DeadlineLabel from '@/components/DeadlineLabel'
import type { DemoAssignment, SchedulePart } from '@/types/assistant'

type Props = { part: SchedulePart; day: string; assignments: DemoAssignment[]; blocks: PersonalStudyBlock[]; update: (change: (current: PersonalStudyBlock[]) => PersonalStudyBlock[]) => void; onNavigate: (section: string) => void; onRequest?: (query: string) => void; children: ReactNode }
export default function WeekStudyPlan({ part, day, assignments, blocks, update, onNavigate, onRequest, children }: Props) {
  const week = part.days[0].date
  const available = new Set(assignments.filter(task => !task.personalSkipped).map(task => task.id))
  const plan = blocks.filter(block => block.week === week && available.has(block.taskId) && part.days.some(date => date.date === block.day))
  const active = assignments.filter(task => task.status !== 'submitted' && !task.personalSkipped)
  const load = dayStudyLoad(day, part.classes, active, plan)
  const crowded = part.days.map(date => dayStudyLoad(date.date, part.classes, active, plan)).filter(load => load.overloaded)
  const selected = plan.filter(block => block.day === day)
  const recommendations = active.filter(task => part.days.some(date => task.dueAt.startsWith(date.date))).sort((a,b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id)).slice(0, crowded.length ? 2 : 3)
  const patch = (id: string, value: Partial<PersonalStudyBlock>) => update(current => current.map(block => block.id === id ? { ...block, ...value } : block))
  const open = (task: DemoAssignment) => onNavigate(`Курсы/${task.courseId}/${task.id}`)
  return <div className="gen-week-plan">
    <div className="gen-week-day-load" role="status"><dl><div><dt>Занятия</dt><dd>{load.classMinutes} мин</dd></div><div><dt>Твой план</dt><dd>{load.personalMinutes} мин</dd></div><div><dt>Несданных работ</dt><dd>{load.deadlines}</dd></div></dl>{load.overloaded ? <strong>Возможна высокая нагрузка</strong> : null}</div>
    {load.windows.length ? <p className="gen-week-note">Окна между занятиями: {load.windows.map(window => `${window.start}–${window.end}`).join(', ')}. Личная занятость вне плана не учтена.</p> : <p className="gen-week-note">{load.classMinutes ? 'Между занятиями нет окон от 30 минут.' : 'На этот день в расписании нет занятий.'} Это не учитывает твою занятость вне учебы.</p>}
{crowded.length ? <div className="gen-week-recommendation"><details className="gen-week-pressure"><summary>Дней с высокой нагрузкой: {crowded.length}</summary><ul>{crowded.map(load => <li key={load.day}><strong>{part.days.find(date => date.date === load.day)!.label}</strong><span>Занятия: {load.classMinutes} мин · Твой план: {load.personalMinutes} мин · Несданных работ: {load.deadlines}</span></li>)}</ul><p>Если не успеваешь, проверь варианты в «Я в огне».</p></details>{onRequest ? <Button type="button" variant="outline" className="fire-help-action" onClick={() => onRequest('🔥 Я в огне')}>🔥 Я в огне</Button> : null}</div> : null}
    {children}
    <section className="gen-week-section" aria-label="Личная подготовка"><h4>Твоя подготовка</h4><p className="gen-week-note">Личные блоки меняют только твой план. Отметка о выполнении не отправляет задание.</p>
      {selected.length ? <ul className="gen-week-blocks">{selected.map(block => { const task = assignments.find(task => task.id === block.taskId)!; return <li key={block.id} data-done={block.done}>
        <div className="gen-week-block-title"><Checkbox checked={block.done} aria-label={`Подготовка выполнена: ${task.title}`} onChange={event => patch(block.id, { done: event.currentTarget.checked })} /><Button type="button" variant="link" onClick={() => open(task)}>{task.title}</Button><Button type="button" variant="ghost" size="icon" aria-label={`Удалить личный блок: ${task.title}`} onClick={() => update(current => current.filter(item => item.id !== block.id))}><Trash2 aria-hidden="true" /></Button></div>
        <div className="gen-week-block-edit"><div className="gen-week-block-controls"><Select value={block.day} onValueChange={day => patch(block.id, { day })}><SelectTrigger aria-label={`День подготовки: ${task.title}`}><SelectValue /></SelectTrigger><SelectContent>{part.days.map(date => <SelectItem key={date.date} value={date.date}>{date.label}</SelectItem>)}</SelectContent></Select><Select value={String(block.minutes)} onValueChange={minutes => patch(block.id, { minutes: Number(minutes) })}><SelectTrigger aria-label={`Длительность подготовки: ${task.title}`}><SelectValue /></SelectTrigger><SelectContent>{[30,60,90,120].map(minutes => <SelectItem key={minutes} value={String(minutes)}>{minutes} мин</SelectItem>)}</SelectContent></Select></div><HomeworkPersonalControl taskId={task.id} /></div>
        {block.day > task.dueAt.slice(0, 10) ? <p className="gen-week-note">Подготовка запланирована после срока задания. Проверь день.</p> : null}
      </li> })}</ul> : <p className="gen-week-note">На этот день ты еще не добавил подготовку. Выбери работу ниже.</p>}
    </section>
    <section className="gen-week-section" aria-label="Рекомендации на неделю"><h4>На что обратить внимание</h4>

      {recommendations.length ? <ul className="gen-week-recommendations">{recommendations.map(task => { const planned = plan.some(block => block.taskId === task.id); const material = academicTasks.find(item => item.id === task.id)?.materialIds.find(id => academicMaterials.some(material => material.id === id)); return <li key={task.id}><div className="gen-week-recommendation-heading"><div><Button type="button" variant="link" onClick={() => open(task)}>{task.title}</Button><p className="gen-row-meta">{task.course}</p></div><DeadlineLabel dueAt={task.dueAt} status={task.status} prefix="До " /></div><p className="gen-week-note">Работа еще не отправлена. Это один из ближайших сроков на неделе.</p><div className="gen-week-actions"><HomeworkPersonalControl taskId={task.id} /><Button type="button" variant="outline" disabled={planned} onClick={() => update(current => current.some(block => block.week === week && block.taskId === task.id) ? current : [...current, { id: crypto.randomUUID(), week, taskId: task.id, day, minutes: 60, done: false }])}>{planned ? 'В твоем плане' : 'Добавить 60 мин подготовки'}</Button>{material ? <Button type="button" variant="ghost" onClick={() => { onNavigate(`Курсы/${task.courseId}`); navigate({ courseTab: 'materials', materialId: material }, true) }}>Материалы</Button> : null}</div></li> })}</ul> : <p className="gen-week-note">На этой неделе нет несданных работ с известным сроком. Можешь открыть расписание и курсы.</p>}
    </section>
    <details className="gen-week-method"><summary>Как оценивается нагрузка</summary><p>Считаю время известных занятий без двойного учета пересечений, длительность невыполненных личных блоков и несданные работы в личном плане со сроком на этот день. Высокая нагрузка — от трех дедлайнов, от шести часов занятий и подготовки или от двух дедлайнов вместе с тремя часами занятий и подготовки. Это ориентир, а не оценка сложности работ. Окна — только промежутки между занятиями от 30 минут; время личных блоков внутри дня не задано. Вес отдельной работы неизвестен и не используется. Пропущенные тобой работы и их подготовка в нагрузку не входят; академические дедлайны остаются в расписании. Личный план сохраняется в этом браузере.</p></details>
  </div>
}
