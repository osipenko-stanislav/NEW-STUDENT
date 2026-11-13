import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import FileIcon from '@/components/FileIcon'
import { Button } from '@/components/ui/button'
import type { ConversationMaterial } from '@/types/material'
import { Badge } from '@/components/ui/badge'
import GenerativeContent from '@/components/generative-ui/GenerativeContent'
import type { GenerationState } from '@/types/assistant'
import type { Conversation, MessagePart } from '@/types/conversation'
import { m } from 'motion/react'
import { useAppMotion } from '@/components/MotionProvider'

function MessageContent({ part, onNavigate, visibleCharacters, animate }: { part: MessagePart; onNavigate: (section: string) => void; visibleCharacters?: number; animate: boolean }) {
  return part.type === 'text' ? <p className="message-text">{visibleCharacters === undefined ? part.text : part.text.slice(0, visibleCharacters)}</p>
    : visibleCharacters === undefined ? <GenerativeContent part={part} onNavigate={onNavigate} animate={animate} /> : null
}

export default function ConversationMessages({ conversation, materials, onOpenMaterial, generation, onNavigate, onFollowUp, onNavigatorHome }: {
  conversation: Conversation
  materials: ConversationMaterial[]
  onOpenMaterial: (id: string) => void
  generation?: GenerationState
  onNavigate: (section: string) => void
  onNavigatorHome: () => void
  onFollowUp: (text: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { spatialMotion, transition } = useAppMotion()
  const followBottom = useRef(true)
  // Keep the opening history stable through StrictMode renders and streamed updates.
  // New responses retain their entrance animation until their delayed UI mounts.
  const [initialMessageIds] = useState(() => new Set(conversation.messages
    .filter(message => message.id !== generation?.messageId).map(message => message.id)))
  const lastAssistant = [...conversation.messages].reverse().find(message => message.role === 'assistant')?.id

  useLayoutEffect(() => {
    const viewport = scrollRef.current
    // Follow streamed text, but keep the reading position when a large UI block appears.
    if (viewport && followBottom.current && generation) viewport.scrollTop = viewport.scrollHeight
  }, [conversation.id, conversation.messages.length, generation?.visibleCharacters, !!generation])

  useLayoutEffect(() => {
    followBottom.current = true
    const viewport = scrollRef.current
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  }, [conversation.id, conversation.messages.length])

  return <div ref={scrollRef} className="conversation-messages" role="log" aria-label="Переписка"
    aria-live={generation ? 'off' : 'polite'} aria-relevant="additions" tabIndex={0}
    onScroll={event => { const el = event.currentTarget; followBottom.current = el.scrollHeight - el.clientHeight - el.scrollTop < 64 }}>
    <header className="conversation-page-heading">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={onNavigatorHome}><ArrowLeft aria-hidden="true" />В Навигатор</Button>
      <h1 id="conversation-title">{conversation.title}</h1>
    </header>
    {conversation.messages.map(message => <m.article key={message.id} className={`chat-message chat-message-${message.role}`}
      initial={!initialMessageIds.has(message.id) ? spatialMotion ? { opacity: 0, y: 8 } : { opacity: 0 } : false}
      animate={{ opacity: 1, y: 0 }} transition={transition}
      aria-label={message.role === 'user' ? 'Сообщение пользователя' : 'Сообщение ассистента'}>
      <div className="message-author">{message.role === 'user' ? 'Ты' : 'Ассистент'}</div>
      <div className="message-body">
        {message.command ? <Badge variant="ai" className="message-command">{message.command}</Badge> : null}
        {message.attachments?.length ? <ul className="mb-2 space-y-1" aria-label="Вложения сообщения">
          {message.attachments.map((attachment, index) => {
            const material = materials.find(material => material.id === attachment.materialId)
            const available = attachment.materialId !== null && !!material
            return <li key={index}>
              {available ? <Button type="button" variant="outline" className="h-auto max-w-full justify-start gap-2 px-2 py-1.5 text-left text-xs"
                onClick={() => onOpenMaterial(attachment.materialId!)} aria-label={`Открыть вложение: ${attachment.name}`}>
                <FileIcon name={attachment.name} type={material?.type} size="compact" /><span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{attachment.name}</span>
              </Button> : <span className="flex items-start gap-2 text-xs text-muted-foreground">
                <FileIcon name={attachment.name} size="compact" unavailable />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{attachment.name}<span className="block">Файл недоступен</span></span>
              </span>}
            </li>
          })}
        </ul> : null}
        {generation?.messageId === message.id && generation.phase === 'thinking' ? <div className="gen-thinking" role="status">
          <span className="gen-thinking-dots" aria-hidden="true"><i /><i /><i /></span>Готовлю ответ…
        </div> : <>
          {message.content.map((part, index) => <MessageContent key={index} part={part} onNavigate={onNavigate} animate={!initialMessageIds.has(message.id)}
            visibleCharacters={generation?.messageId === message.id ? generation.visibleCharacters : undefined} />)}
          {generation?.messageId === message.id ? <span className="sr-only" role="status">Ассистент печатает</span> : null}
        </>}
        {!generation && message.id === lastAssistant && message.suggestions?.length ? <div className="gen-followups" aria-label="Продолжить разговор">
          {message.suggestions.map(suggestion => <Button type="button" key={suggestion} variant="outline" onClick={() => onFollowUp(suggestion)}>{suggestion}</Button>)}
        </div> : null}
      </div>
    </m.article>)}
  </div>
}
