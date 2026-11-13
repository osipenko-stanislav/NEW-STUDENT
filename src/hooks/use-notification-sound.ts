import { useEffect, useRef } from 'react'
/** The owner must enable/resume AudioContext in an explicit user gesture. Never autoplay. */
export function useNotificationSound(revision: number, context: AudioContext | null, enabled: boolean) {
  const previous = useRef(revision)
  useEffect(() => {
    const isNew = revision > previous.current
    previous.current = revision
    if (!isNew || !enabled || context?.state !== 'running') return
    const voices = [880, 1318.5].map((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const start = context.currentTime + index * .13
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(.22, start + .008)
      gain.gain.exponentialRampToValueAtTime(.001, start + .7)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + .7)
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
      return oscillator
    })
    return () => voices.forEach(voice => { try { voice.stop() } catch { /* already ended */ } })
  }, [revision, context, enabled])
}
