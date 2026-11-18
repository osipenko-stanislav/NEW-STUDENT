import { useState } from 'react'
import { ChevronDown, Download, Snowflake, Sun } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { GradeValue } from '@/components/ui/grade-value'

import { navigate } from '@/hooks/use-navigation'
import { gradebookSessions } from '@/data/gradebook'
import { actionStatus } from '@/lib/action-status'
import '@/grades.css'

export default function GradebookWorkspace() {
  const sessions = gradebookSessions
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  function toggleSession(id: string) {
    setCollapsed(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function onDownload() {
    actionStatus.report({ key: 'gradebook-download', label: 'Загрузка зачетки началась', detail: 'Все сессии' })
  }
  return <section className="page-container gradebook-page" data-layout="data" aria-label="Зачетка">
    <div className="gradebook-actions"><Button type="button" variant="outline" onClick={() => navigate({ section: 'Прогноз', studyTarget: undefined })}>Открыть прогноз</Button>{sessions.length ? <Button type="button" variant="outline" onClick={onDownload}><Download aria-hidden="true" />Скачать зачетку</Button> : null}</div>
    {!sessions.length ? <EmptyState icon={Snowflake} title="Оценок пока нет" description="Они появятся после первой сессии." /> : sessions.map(session => {
      const title = `${session.season === 'winter' ? 'Зимняя' : 'Летняя'} сессия, ${session.year}`
      const SeasonIcon = session.season === 'winter' ? Snowflake : Sun
      return <Card key={session.id} className="gradebook-session" aria-labelledby={`session-${session.id}`}>
        <CardHeader><h2 id={`session-${session.id}`}><SeasonIcon aria-hidden="true" />{title}</h2><Button type="button" variant="ghost" size="icon" aria-label={`${collapsed.has(session.id) ? 'Развернуть' : 'Свернуть'}: ${title}`} aria-expanded={!collapsed.has(session.id)} aria-controls={`session-table-${session.id}`} onClick={() => toggleSession(session.id)}><ChevronDown aria-hidden="true" className={collapsed.has(session.id) ? '-rotate-90' : ''} /></Button></CardHeader>
        <CardContent id={`session-table-${session.id}`} hidden={collapsed.has(session.id)}><div className="grades-table-shell"><Table aria-label={title} className="gradebook-table"><TableHeader><TableRow><TableHead scope="col">Предмет</TableHead><TableHead scope="col">Вид контроля</TableHead><TableHead scope="col">Оценка</TableHead></TableRow></TableHeader><TableBody>{session.rows.map(row => <TableRow key={row.id}><TableCell>{row.title}</TableCell><TableCell>{row.control}</TableCell><TableCell>{typeof row.grade === 'string' ? row.grade : <GradeValue value={row.grade} />}</TableCell></TableRow>)}</TableBody></Table></div></CardContent>
      </Card>
    })}
  </section>
}
