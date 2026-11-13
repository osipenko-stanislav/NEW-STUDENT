import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, Mic, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Phase = 'idle' | 'recording' | 'transcribing'
export default function VoiceInputDemo({ disabled, onBusyChange, onTranscript }: {
  disabled: boolean; onBusyChange: (busy: boolean) => void; onTranscript: (text: string) => void
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [seconds, setSeconds] = useState(0)
  const [notice, setNotice] = useState('')
  const transcriptRef = useRef(onTranscript)
  transcriptRef.current = onTranscript
  const busy = phase !== 'idle'
  useEffect(() => { onBusyChange(busy); return () => onBusyChange(false) }, [busy, onBusyChange])
  useEffect(() => {
    if (phase !== 'recording') return
    const startedAt = Date.now()
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setSeconds(Math.min(60, elapsed))
      if (elapsed >= 60) setPhase('transcribing')
    }, 250)
    return () => clearInterval(timer)
  }, [phase])
  useEffect(() => {
    if (phase !== 'transcribing') return
    const timer = setTimeout(() => {
      transcriptRef.current('Найди материалы по Python')
      setPhase('idle')
      setNotice('Текст добавлен в поле ввода. Его можно изменить перед отправкой.')
    }, 1000)
    return () => clearTimeout(timer)
  }, [phase])
  useEffect(() => {
    if (!busy) return
    const cancel = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !document.querySelector('[role="dialog"][data-state="open"]')) {
        event.preventDefault(); setPhase('idle'); setNotice('Запись отменена. Текст запроса сохранен.')
      }
    }
    window.addEventListener('keydown', cancel)
    return () => window.removeEventListener('keydown', cancel)
  }, [busy])
  return <>
    {busy ? <div className="voice-demo-panel" id="voice-demo-panel">
      <div className="voice-demo-heading"><span className="voice-demo-label"><span className="voice-demo-dot" aria-hidden="true" />{phase === 'recording' ? 'Идет запись' : 'Распознаем речь…'}</span><span className="voice-demo-time" aria-label={`Длительность: ${seconds} секунд`}>00:{String(seconds).padStart(2, '0')}</span></div>
      <div className={`voice-demo-wave ${phase === 'transcribing' ? 'is-processing' : ''}`} aria-hidden="true">{[10, 18, 26, 14, 30, 22, 12, 28, 18, 32, 14, 24, 10, 20, 28, 16, 24, 12, 30, 20].map((height, index) => <span key={index} style={{ height, animationDelay: `${index * -90}ms` }} />)}</div>
      <p className="voice-demo-caption">Останови запись, чтобы добавить текст в сообщение.</p>
      <span className="sr-only" role="status">{phase === 'recording' ? 'Запись началась. Останови запись, чтобы добавить текст, или отмени.' : 'Распознаем речь.'}</span>
    </div> : null}
    <span className="sr-only" role="status">{notice}</span>
    {busy ? <Button type="button" variant="ghost" size="icon" className="voice-input-button" aria-label="Отменить голосовой ввод" onClick={() => { setPhase('idle'); setNotice('Запись отменена. Текст запроса сохранен.') }}><X aria-hidden="true" /></Button> : null}
    <Button type="button" variant={phase === 'recording' ? 'secondary' : 'ghost'} size="icon" className="voice-input-button" disabled={disabled || phase === 'transcribing'} aria-label={phase === 'recording' ? 'Остановить запись' : phase === 'transcribing' ? 'Распознавание речи' : 'Голосовой ввод'} aria-controls={busy ? 'voice-demo-panel' : undefined} aria-pressed={phase === 'recording'} onClick={() => {
      setNotice('')
      if (phase === 'recording') setPhase('transcribing')
      else { setSeconds(0); setPhase('recording') }
    }}>{phase === 'recording' ? <Square aria-hidden="true" /> : phase === 'transcribing' ? <LoaderCircle aria-hidden="true" className="voice-demo-spinner" /> : <Mic aria-hidden="true" />}</Button>
  </>
}
