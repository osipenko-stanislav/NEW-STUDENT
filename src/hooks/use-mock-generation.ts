import { useEffect, useRef, useState } from 'react'
import type { GenerationState } from '@/types/assistant'

export function useMockGeneration() {
  const [generations, setGenerations] = useState<Record<string, GenerationState>>({})
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => () => {
    for (const timer of timers.current.values()) clearTimeout(timer)
    timers.current.clear()
  }, [])

  function start(conversationId: string, messageId: string, textLength: number) {
    let visibleCharacters = 0
    const step = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? textLength : 7
    setGenerations(current => ({ ...current, [conversationId]: { messageId, visibleCharacters, phase: 'thinking' } }))
    const tick = () => {
      visibleCharacters = Math.min(textLength, visibleCharacters + step)
      setGenerations(current => ({ ...current, [conversationId]: { messageId, visibleCharacters, phase: 'typing' } }))
      timers.current.set(conversationId, setTimeout(visibleCharacters < textLength ? tick : () => cancel(conversationId), visibleCharacters < textLength ? 32 : 180))
    }
    timers.current.set(conversationId, setTimeout(tick, 480))
  }

  function cancel(conversationId: string) {
    const timer = timers.current.get(conversationId)
    if (timer !== undefined) clearTimeout(timer)
    timers.current.delete(conversationId)
    setGenerations(current => {
      const next = { ...current }
      delete next[conversationId]
      return next
    })
  }

  return { generations, start, cancel, isGenerating: (id: string) => timers.current.has(id) }
}
