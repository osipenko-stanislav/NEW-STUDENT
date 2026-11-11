import { useLayoutEffect, useRef } from 'react'
import { File, FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ConversationMaterial } from '@/types/material'
import { Badge } from '@/components/ui/badge'
import GenerativeContent from '@/components/generative-ui/GenerativeContent'
import type { GenerationState } from '@/types/assistant'
import type { Conversation, MessagePart } from '@/types/conversation'

function MessageContent({ part, onNavigate, visibleCharacters }: { part: MessagePart; onNavigate: (section: string) => void; visibleCharacters?: number }) {
  return part.type === 'text' ? <p className="message-text">{visibleCharacters === undefined ? part.text : part.text.slice(0, visibleCharacters)}</p>
    : visibleCharacters === undefined ? <GenerativeContent part={part} onNavigate={onNavigate} /> : null
}

export default function ConversationMessages({ conversation, materials, onOpenMaterial, generation, onNavigate, onFollowUp }: {
  conversation: Conversation
  materials: ConversationMaterial[]
  onOpenMaterial: (id: string) => void
  generation?: GenerationState
  onNavigate: (section: string) => void
  onFollowUp: (text: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const followBottom = useRef(true)
  const lastAssistant = [...conversation.messages].reverse().find(message => message.role === 'assistant')?.id

  useLayoutEffect(() => {
    const viewport = scrollRef.current
    if (viewport && followBottom.current) viewport.scrollTop = viewport.scrollHeight
  }, [conversation.id, conversation.messages.length, generation?.visibleCharacters, !!generation])

  useLayoutEffect(() => {
    followBottom.current = true
    const viewport = scrollRef.current
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  }, [conversation.id, conversation.messages.length])

  return <div ref={scrollRef} className="conversation-messages" role="log" aria-label="Переписка"
    aria-live={generation ? 'off' : 'polite'} aria-relevant="additions" tabIndex={0}
    onScroll={event => { const el = event.currentTarget; followBottom.current = el.scrollHeight - el.clientHeight - el.scrollTop < 64 }}>
    <h2 id="conversation-title" className="sr-only">{conversation.title}</h2>
    {conversation.messages.map(message => <article key={message.id} className={`chat-message chat-message-${message.role}`}
      aria-label={message.role === 'user' ? 'Сообщение пользователя' : 'Сообщение ассистента'}>
      <div className="message-author">{message.role === 'user' ? 'Вы' : 'Ассистент'}</div>
      <div className="message-body">
        {message.command ? <Badge variant="secondary" className="message-command">{message.command}</Badge> : null}
        {message.attachments?.length ? <ul className="mb-2 space-y-1" aria-label="Вложения сообщения">
          {message.attachments.map((attachment, index) => {
            const available = attachment.materialId !== null && materials.some(material => material.id === attachment.materialId)
            return <li key={index}>
              {available ? <Button type="button" variant="outline" className="h-auto max-w-full justify-start gap-2 px-2 py-1.5 text-left text-xs"
                onClick={() => onOpenMaterial(attachment.materialId!)} aria-label={`Открыть вложение: ${attachment.name}`}>
                <File className="size-3.5 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{attachment.name}</span>
              </Button> : <span className="flex items-start gap-2 text-xs text-muted-foreground">
                <FileX className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{attachment.name}<span className="block">Файл недоступен</span></span>
              </span>}
            </li>
          })}
        </ul> : null}
        {generation?.messageId === message.id && generation.phase === 'thinking' ? <div className="gen-thinking" role="status">
          <span className="gen-thinking-dots" aria-hidden="true"><i /><i /><i /></span>Готовлю ответ…
        </div> : <>
          {message.content.map((part, index) => <MessageContent key={index} part={part} onNavigate={onNavigate}
            visibleCharacters={generation?.messageId === message.id ? generation.visibleCharacters : undefined} />)}
          {generation?.messageId === message.id ? <span className="sr-only" role="status">Ассистент печатает</span> : null}
        </>}
        {!generation && message.id === lastAssistant && message.suggestions?.length ? <div className="gen-followups" aria-label="Продолжить разговор">
          {message.suggestions.map(suggestion => <Button type="button" key={suggestion} variant="outline" onClick={() => onFollowUp(suggestion)}>{suggestion}</Button>)}
        </div> : null}
      </div>
    </article>)}
  </div>
}
