import { BookOpen, CalendarClock, VideoOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { courseAssignment, curriculumBlocks, courseInfo, featuredCourseTitle, syllabusUrl, handbookUrl, type CourseRecording } from '@/data/courses'
export type CourseDialog = 'syllabus' | 'assignment' | 'chat' | 'help' | null
export function RecordingPreview({ recording, onClose, onRecordings }: { recording: CourseRecording | null; onClose: () => void; onRecordings?: () => void }) {
  return <Dialog open={!!recording} onOpenChange={open => { if (!open) onClose() }}><DialogContent className="course-recording-dialog">
    <DialogHeader className="pr-6 text-left"><DialogTitle>{recording?.title}</DialogTitle><DialogDescription>{featuredCourseTitle} · {recording?.duration}</DialogDescription></DialogHeader>
    <div className="course-video-unavailable"><VideoOff aria-hidden="true" /><h3>Запись пока недоступна</h3><p>Здесь появится плеер, когда запись будет доступна.</p></div>
    {onRecordings ? <Button type="button" variant="outline" onClick={onRecordings}>Все видеозаписи курса</Button> : null}
  </DialogContent></Dialog>
}
export default function CourseDialogs({ dialog, onClose, onOpenBlock, onAskNavigator }: { dialog: CourseDialog; onClose: () => void; onOpenBlock: (id: string) => void; onAskNavigator: (query: string) => void }) {
  const { formatDateTime } = useDisplayFormats()
  const titles = { syllabus: `Силлабус · ${featuredCourseTitle}`, assignment: courseAssignment.title, chat: `Чат курса · ${featuredCourseTitle}`, help: 'Помощь в учёбе' }
  return <Dialog open={dialog !== null} onOpenChange={open => { if (!open) onClose() }}><DialogContent className="course-info-dialog">
    <DialogHeader className="pr-6 text-left"><DialogTitle>{dialog ? titles[dialog] : ''}</DialogTitle><DialogDescription>{dialog === 'chat' ? 'Общение по курсу' : dialog === 'help' ? 'Учебные вопросы и доступные источники' : 'Информация о курсе'}</DialogDescription></DialogHeader>
    {dialog === 'syllabus' ? <div className="course-dialog-body"><p>{courseInfo.description}</p>
      <p>{courseInfo.workload}</p><h3>Программа курса</h3><ol className="course-syllabus-list">{curriculumBlocks.map((block, index) => <li key={block.id}><button type="button" onClick={() => onOpenBlock(block.id)}><span>{index + 1}</span>{block.title}<BookOpen aria-hidden="true" /></button></li>)}</ol>
      <h3>Система оценивания</h3><dl className="course-detail-list">{courseInfo.assessments.map(item => <div key={item.title}><dt>{item.title} · {item.count}</dt><dd>{item.weight}%</dd></div>)}</dl><a className="course-text-link" href={syllabusUrl} target="_blank" rel="noreferrer">Оригинальный силлабус в Хэндбуке ↗</a></div> : null}
    {dialog === 'assignment' ? <div className="course-dialog-body"><Badge variant="neutral">{courseAssignment.status}</Badge><p>{courseAssignment.description}</p>
      <dl className="course-detail-list"><div><dt>Срок сдачи</dt><dd><CalendarClock className="size-4" aria-hidden="true" />{formatDateTime(courseAssignment.dueAt)} МСК</dd></div><div><dt>Максимальный балл</dt><dd>{courseAssignment.points}</dd></div></dl>
      <p className="course-dialog-note">Загрузка решений и изменение результатов пока недоступны.</p></div> : null}
    {dialog === 'chat' ? <div className="course-dialog-body"><div className="course-chat-preview"><span className="course-chat-avatar">РВ</span><div><strong>Роман Васильев</strong><span>Преподаватель</span><p>Вопросы по лекциям и лабораторным обсуждаем в чате курса. К вопросу можно добавить номер недели и название задания.</p></div></div>
      <p className="course-dialog-note">Отправка в чат курса пока недоступна.</p><Button type="button" variant="outline" disabled>Отправить сообщение</Button></div> : null}
    {dialog === 'help' ? <div className="course-dialog-body"><p>Программа, сроки и учебные материалы собраны на странице курса. Информация о дисциплинах бакалавриата доступна в Хэндбуке.</p>
      <div className="course-dialog-actions"><Button asChild variant="outline"><a href={handbookUrl} target="_blank" rel="noreferrer">Открыть Хэндбук</a></Button><Button type="button" variant="ai-outline" onClick={() => { onClose(); onAskNavigator(`Помоги разобраться с курсом ${featuredCourseTitle}`) }}>Спросить Навигатора</Button></div></div> : null}
  </DialogContent></Dialog>
}
