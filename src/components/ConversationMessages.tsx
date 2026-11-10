import { useLayoutEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Conversation, MessagePart } from '@/types/conversation'

function MessageContent({ part }: { part: MessagePart }) {
  switch (part.type) {
    case 'text': return <p className="message-text">{part.text}</p>
  }
}

export default function ConversationMessages({ conversation }: { conversation: Conversation }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const viewport = scrollRef.current
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  }, [conversation.id, conversation.messages.length])

  return <div ref={scrollRef} className="conversation-messages" role="log" aria-label="Переписка"
    aria-live="polite" aria-relevant="additions" tabIndex={0}>
    <h2 id="conversation-title" className="sr-only">{conversation.title}</h2>
    {conversation.messages.map(message => <article key={message.id} className={`chat-message chat-message-${message.role}`}
      aria-label={message.role === 'user' ? 'Сообщение пользователя' : 'Сообщение ассистента'}>
      <div className="message-author">{message.role === 'user' ? 'Вы' : 'Ассистент'}</div>
      <div className="message-body">
        {message.command ? <Badge variant="secondary" className="message-command">{message.command}</Badge> : null}
        {message.content.map((part, index) => <MessageContent key={index} part={part} />)}
      </div>
    </article>)}
  </div>
}
