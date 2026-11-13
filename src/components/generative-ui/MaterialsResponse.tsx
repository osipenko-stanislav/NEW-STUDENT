import { Library, ChevronRight } from 'lucide-react'
import FileIcon from '@/components/FileIcon'
import { SemanticIcon } from '@/components/ui/semantic-icon'
import { Button } from '@/components/ui/button'
import { navigate } from '@/hooks/use-navigation'
import { openGlobalSearch } from '@/lib/global-search'
import type { MaterialsPart } from '@/types/assistant'

const subjectLabels = { math: 'Математика', python: 'Python', development: 'Разработка', general: 'Общие дисциплины' }
const normalize = (text: string) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/\s+/g, ' ').trim()
export default function MaterialsResponse({ part, onNavigate }: { part: MaterialsPart; onNavigate: (section: string) => void }) {
  const terms = normalize(part.query).split(' ').filter(Boolean)
  const items = part.items.filter(item => (!part.courseId || item.courseId === part.courseId) && (part.subject === 'all' || item.subject === part.subject)
    && (part.fileType === 'all' || item.fileType === part.fileType) && terms.every(term => normalize(`${item.title} ${item.course} ${item.path}`).includes(term)))
  return <section className="gen-ui" aria-label="Учебные материалы">
    <div className="gen-header"><h3 className="gen-heading"><SemanticIcon icon={Library} tone="violet" />Учебные материалы</h3></div>
    {items.length ? <ul className="gen-material-list gen-material-list-compact" aria-label="Учебные материалы">{items.slice(0, 5).map(item => <li key={item.id}>
      <FileIcon name={`${item.title}.${item.fileType}`} />
      <button className="gen-material-open" onClick={() => { onNavigate(`Курсы/${item.courseId}`); navigate({ courseTab: 'materials', materialId: item.id }, true) }}>
        <span className="gen-row-title">{item.title}</span><span className="gen-row-meta">{item.fileType} · {item.course}</span>
      </button><ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </li>)}</ul> : <p className="gen-empty">Материалы по запросу не найдены.</p>}
    <div className="gen-footer"><Button variant="outline" onClick={() => openGlobalSearch([part.query, part.courseId ? part.items.find(item => item.courseId === part.courseId)?.course : part.subject !== 'all' ? subjectLabels[part.subject] : '', part.fileType !== 'all' ? part.fileType : ''].filter(Boolean).join(' '), 'materials')}>Все материалы</Button></div>
  </section>
}
