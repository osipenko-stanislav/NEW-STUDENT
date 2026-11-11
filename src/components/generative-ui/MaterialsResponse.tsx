import { useId, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CourseFilter, MaterialsPart } from '@/types/assistant'

const normalize = (text: string) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/\s+/g, ' ').trim()
export default function MaterialsResponse({ part, onNavigate }: { part: MaterialsPart; onNavigate: (section: string) => void }) {
  const [query, setQuery] = useState(part.query)
  const [subject, setSubject] = useState(part.subject)
  const [fileType, setFileType] = useState(part.fileType)
  const id = useId()
  const terms = normalize(query).split(' ').filter(Boolean)
  const items = part.items.filter(item => (subject === 'all' || item.subject === subject) && (fileType === 'all' || item.fileType === fileType)
    && terms.every(term => normalize(`${item.title} ${item.course} ${item.path}`).includes(term)))
  return <section className="gen-ui" aria-label="Поиск учебных материалов">
    <div className="gen-header"><h3>Учебные материалы</h3><p>Демонстрационные материалы из курсов</p></div>
    <div className="gen-material-filters">
      <label className="sr-only" htmlFor={`${id}-search`}>Поиск учебных материалов</label>
      <Input id={`${id}-search`} value={query} onChange={event => setQuery(event.target.value)} placeholder="Название, курс или путь" className="h-8 text-xs" />
      <div className="gen-material-selects">
        <label htmlFor={`${id}-subject`} className="sr-only">Направление</label>
        <select id={`${id}-subject`} className="gen-select min-w-0 flex-1" value={subject} onChange={event => setSubject(event.target.value as CourseFilter)}>
          <option value="all">Все курсы</option><option value="math">Математика</option><option value="python">Python</option>
        </select>
        <label htmlFor={`${id}-type`} className="sr-only">Тип файла</label>
        <select id={`${id}-type`} className="gen-select" value={fileType} onChange={event => setFileType(event.target.value as MaterialsPart['fileType'])}>
          <option value="all">Все типы</option><option value="PDF">PDF</option><option value="IPYNB">IPYNB</option>
        </select>
      </div><p className="text-xs text-muted-foreground" role="status">Найдено: {items.length}</p>
    </div>
    {items.length ? <ul className="gen-material-list" aria-label="Учебные материалы">
      {items.map(item => <li key={item.id}><div className="flex items-start justify-between gap-2"><span className="gen-row-title">{item.title}</span><Badge variant="outline" className="shrink-0 text-[10px]">{item.fileType}</Badge></div>
        <p className="gen-row-meta">{item.course}</p><p className="gen-material-path">{item.path}</p>
        <Button type="button" variant="outline" size="sm" className="mt-2 h-7 text-xs" aria-label={`Перейти в курсы: ${item.title}`} onClick={() => onNavigate('Курсы')}>Перейти в курсы</Button>
      </li>)}
    </ul> : <p className="gen-empty">Материалы не найдены. Измените запрос или фильтры.</p>}
    <p className="gen-note">Кнопки открывают раздел «Курсы». Страницы файлов в прототипе пока недоступны.</p>
  </section>
}
