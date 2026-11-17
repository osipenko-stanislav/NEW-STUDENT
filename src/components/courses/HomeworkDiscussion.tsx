import { useEffect, useRef, useState } from 'react'
import { ArrowUp, CalendarClock, Paperclip, Reply, Smile, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import FileIcon from '@/components/FileIcon'
import { useDisplayFormats } from '@/components/SettingsProvider'
import { updateHomework } from '@/hooks/use-homework'
import { homeworkComment, type HomeworkComment, type HomeworkCommentAttachment } from '@/lib/homework-storage'
import { deleteMaterialFiles, getMaterialFile, putMaterialFiles } from '@/lib/material-files'

const emojis = ['👍', '❤️', '🔥', '😂', '😮', '😢', '👏', '🎉', '🤔', '👀']
const avatarSrc = `${import.meta.env.BASE_URL}assets/figma/avatar-image.png`
const imageType = (file: HomeworkCommentAttachment) => /^image\/(png|jpeg|webp|gif)$/.test(file.type)
const sizeLabel = (size: number) => size < 1024 * 1024 ? `${Math.ceil(size / 1024)} КБ` : `${(size / 1024 / 1024).toFixed(1)} МБ`
function Attachment({ file, onPreview }: { file: HomeworkCommentAttachment; onPreview: (url: string, name: string) => void }) {
  const [url, setUrl] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true; let objectUrl = ''
    getMaterialFile(file.id).then(blob => { if (active && blob) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl) } else if (active) setFailed(true) }).catch(() => { if (active) setFailed(true) })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [file.id])
  if (!url) return <span className="text-xs text-muted-foreground">{file.name} · {failed ? 'Файл недоступен' : 'Открываем файл…'}</span>
  return imageType(file) ? <button type="button" className="discussion-image" onClick={() => onPreview(url, file.name)} aria-label={`Открыть изображение: ${file.name}`}><img src={url} alt={file.name} /></button> : <a className="discussion-file" href={url} download={file.name}><FileIcon name={file.name} size="compact" /><span>{file.name}<small>{sizeLabel(file.size)}</small></span></a>
}
export default function HomeworkDiscussion({ taskId, comments, archived }: { taskId: string; comments: HomeworkComment[]; archived: boolean }) {
  const { formatDateTime } = useDisplayFormats()
  const [text, setText] = useState('')
  const [files, setFiles] = useState<(HomeworkCommentAttachment & { file: File; url: string })[]>([])
  const [reply, setReply] = useState<HomeworkComment['replyTo']>()
  const [preview, setPreview] = useState<{ url: string; name: string }>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [date, setDate] = useState('')
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const draftFiles = useRef(files); draftFiles.current = files
  useEffect(() => () => draftFiles.current.forEach(f => URL.revokeObjectURL(f.url)), [])
  useEffect(() => { const e = textarea.current; if (e) { e.style.height = 'auto'; e.style.height = `${Math.min(200, e.scrollHeight)}px` } }, [text])
  const save = (change: (items: HomeworkComment[]) => HomeworkComment[]) => {
    const ok = updateHomework(taskId, current => ({ ...current, comments: change(current.comments) }))
    if (!ok) setError('Не удалось сохранить сообщение. Проверь свободное место и попробуй ещё раз.')
    return ok
  }
  useEffect(() => {
    if (archived) return
    const next = Math.min(...comments.filter(c => c.scheduledAt).map(c => c.scheduledAt!))
    if (!Number.isFinite(next)) return
    const timer = setTimeout(() => { save(items => items.map(c => c.scheduledAt && c.scheduledAt <= Date.now() ? { ...c, at: Date.now(), scheduledAt: undefined } : c)) }, Math.min(2147483647, Math.max(0, next - Date.now())))
    return () => clearTimeout(timer)
  }, [comments, taskId, archived])
  async function send(scheduledAt?: number) {
    if (busy || archived || (!text.trim() && !files.length)) return
    if (scheduledAt !== undefined && (!Number.isFinite(scheduledAt) || scheduledAt <= Date.now())) { setError('Выбери будущую дату и время.'); return }
    setBusy(true); setError('')
    try {
      await putMaterialFiles(files.map(f => ({ id: f.id, blob: f.file })))
      const attachments = files.map(({ id, name, type, size }) => ({ id, name, type, size }))
      if (!save(items => [...items, homeworkComment(text.trim(), { attachments, replyTo: reply, scheduledAt })])) { await deleteMaterialFiles(attachments.map(f => f.id)); return }
      files.forEach(f => URL.revokeObjectURL(f.url)); setFiles([]); setText(''); setReply(undefined); setScheduleOpen(false); textarea.current?.focus()
    } catch { setError('Не удалось сохранить вложения. Попробуй ещё раз.') } finally { setBusy(false) }
  }
  function toggleReaction(id: string, emoji: string) {
    save(items => items.map(c => {
      if (c.id !== id) return c
      const reactions = [...(c.reactions ?? [])]; const index = reactions.findIndex(r => r.emoji === emoji)
      if (index < 0) reactions.push({ emoji, count: 1, mine: true })
      else { const r = reactions[index]; reactions[index] = { ...r, mine: !r.mine, count: Math.max(0, r.count + (r.mine ? -1 : 1)) } }
      return { ...c, reactions: reactions.filter(r => r.count > 0) }
    }))
  }
  const published = comments.filter(c => !c.scheduledAt)
  const scheduled = comments.filter(c => c.scheduledAt)
  return <section className="homework-comments discussion" aria-labelledby="homework-comments-title">
    <h2 id="homework-comments-title" className="text-lg font-semibold">Обсуждение</h2>
    {!published.length ? <p className="text-sm text-muted-foreground">Задай вопрос или добавь пояснение к решению.</p> : <ol className="discussion-messages">{published.map(message => <li key={message.id} className="discussion-message">
      <img className="discussion-avatar" src={avatarSrc} alt="" aria-hidden="true" /><div className="discussion-message-body">
        <header><strong>{message.author ?? 'Иван'}</strong><time dateTime={new Date(message.at).toISOString()}>{formatDateTime(message.at, true)}</time></header>
        {message.replyTo ? <a className="discussion-quote" href={`#discussion-${message.replyTo.id}`}><strong>{message.replyTo.author}</strong><span>{message.replyTo.text || 'Вложение'}</span></a> : null}
        <div id={`discussion-${message.id}`} className="discussion-text">{message.text}</div>
        {message.attachments?.length ? <div className="discussion-attachments">{message.attachments.map(file => <Attachment key={file.id} file={file} onPreview={(url, name) => setPreview({ url, name })} />)}</div> : null}
        <div className="discussion-message-actions">{(message.reactions ?? []).map(r => <Button key={r.emoji} type="button" variant={r.mine ? 'secondary' : 'ghost'} size="sm" disabled={archived} aria-pressed={!!r.mine} aria-label={`${r.emoji}: ${r.count}`} onClick={() => toggleReaction(message.id, r.emoji)}>{r.emoji} {r.count}</Button>)}
          {!archived ? <><Popover><PopoverTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Добавить реакцию"><Smile /></Button></PopoverTrigger><PopoverContent className="discussion-emoji-picker">{emojis.map(emoji => <Button key={emoji} type="button" variant="ghost" size="icon" aria-label={`Реакция ${emoji}`} onClick={() => toggleReaction(message.id, emoji)}>{emoji}</Button>)}</PopoverContent></Popover>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setReply({ id: message.replyTo?.id ?? message.id, author: message.replyTo?.author ?? message.author ?? 'Иван', text: (message.replyTo?.text ?? message.text).slice(0, 120) }); textarea.current?.focus() }}><Reply />Ответить</Button></> : null}
        </div></div></li>)}</ol>}
    {scheduled.length ? <section className="discussion-scheduled" aria-label="Запланированные сообщения"><h3 className="text-sm font-medium">Запланировано</h3><p className="text-xs text-muted-foreground">Отправка произойдёт, когда обсуждение открыто.</p>{scheduled.map(c => <div key={c.id}><p className="discussion-text">{c.text || `${c.attachments?.length ?? 0} вложений`}</p><label className="text-xs">Время отправки<Input type="datetime-local" aria-label="Изменить время отправки" value={new Date(c.scheduledAt! - new Date(c.scheduledAt!).getTimezoneOffset() * 60000).toISOString().slice(0, 16)} disabled={archived} onChange={e => { const at = new Date(e.target.value).getTime(); if (at > Date.now()) save(items => items.map(item => item.id === c.id ? { ...item, scheduledAt: at } : item)); else setError('Выбери будущую дату и время.') }} /></label><Button type="button" variant="ghost" disabled={archived} onClick={() => { if (save(items => items.filter(item => item.id !== c.id))) void deleteMaterialFiles((c.attachments ?? []).map(f => f.id)).catch(() => {}) }}>Отменить отправку</Button></div>)}</section> : null}
    {!archived ? <div className="discussion-compose-row"><img className="discussion-avatar" src={avatarSrc} alt="" aria-hidden="true" /><form className="composer discussion-composer" onSubmit={e => { e.preventDefault(); void send() }}>
      {reply ? <div className="discussion-reply-draft"><div className="discussion-quote"><strong>{reply.author}</strong><span>{reply.text || 'Вложение'}</span></div><Button type="button" variant="ghost" size="icon" aria-label="Отменить ответ" onClick={() => setReply(undefined)}><X /></Button></div> : null}
      <div className="composer-editor"><Textarea ref={textarea} aria-label="Сообщение в обсуждении" placeholder="Напиши сообщение…" className="prompt-textarea border-0 shadow-none focus-visible:ring-0" rows={2} maxLength={10000} value={text} disabled={busy} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); void send() } }} /></div>
      {files.length ? <div className="discussion-draft-files">{files.map(f => <div key={f.id}>{imageType(f) ? <img src={f.url} alt={f.name} /> : <FileIcon name={f.name} size="compact" />}<span>{f.name}<small>{sizeLabel(f.size)}</small></span><Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={`Убрать вложение: ${f.name}`} onClick={() => { URL.revokeObjectURL(f.url); setFiles(items => items.filter(item => item.id !== f.id)) }}><X /></Button></div>)}</div> : null}
      <div className="composer-toolbar"><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" disabled={busy} aria-label="Прикрепить файл к сообщению" onClick={() => fileInput.current?.click()}><Paperclip /></Button><Popover><PopoverTrigger asChild><Button type="button" variant="ghost" size="icon" disabled={busy} aria-label="Добавить эмодзи"><Smile /></Button></PopoverTrigger><PopoverContent className="discussion-emoji-picker">{emojis.map(emoji => <Button key={emoji} type="button" variant="ghost" size="icon" aria-label={`Вставить ${emoji}`} onClick={() => { const e = textarea.current; const start = e?.selectionStart ?? text.length; const end = e?.selectionEnd ?? start; setText(text.slice(0, start) + emoji + text.slice(end)); requestAnimationFrame(() => { e?.focus(); e?.setSelectionRange(start + emoji.length, start + emoji.length) }) }}>{emoji}</Button>)}</PopoverContent></Popover>
      <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}><PopoverTrigger asChild><Button type="button" variant="ghost" size="icon" disabled={busy || (!text.trim() && !files.length)} aria-label="Запланировать сообщение"><CalendarClock /></Button></PopoverTrigger><PopoverContent><label className="text-sm" htmlFor="discussion-schedule">Дата и время отправки</label><Input id="discussion-schedule" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} /><p className="text-xs text-muted-foreground my-3">Отправка произойдёт при открытом обсуждении.</p><Button type="button" disabled={!date || busy} onClick={() => void send(new Date(date).getTime())}>Запланировать</Button></PopoverContent></Popover></div>
      <Button type="submit" variant="ai" size="icon" className="send-button" aria-label="Отправить сообщение" disabled={busy || (!text.trim() && !files.length)}><ArrowUp /></Button></div>
      <input ref={fileInput} type="file" multiple tabIndex={-1} className="sr-only" aria-label="Файлы сообщения" accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.zip" onChange={e => { const selected = Array.from(e.target.files ?? []); e.target.value = ''; if (selected.some(f => !/\.(png|jpe?g|webp|gif|pdf|docx?|txt|md|csv|xlsx|zip)$/i.test(f.name))) { setError('Выбери изображение, документ или ZIP-архив.'); return } if ([...files.map(f => f.file), ...selected].reduce((sum, f) => sum + f.size, 0) > 50 * 1024 * 1024) { setError('Общий размер вложений — до 50 МБ.'); return } setError(''); setFiles(items => [...items, ...selected.map(file => ({ file, id: `discussion-${crypto.randomUUID()}`, name: file.name, type: file.type, size: file.size, url: URL.createObjectURL(file) }))]) }} />
    </form></div> : null}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <Dialog open={!!preview} onOpenChange={open => { if (!open) setPreview(undefined) }}><DialogContent><DialogHeader><DialogTitle>{preview?.name}</DialogTitle></DialogHeader>{preview ? <img className="discussion-lightbox" src={preview.url} alt={preview.name} /> : null}</DialogContent></Dialog>
  </section>
}
