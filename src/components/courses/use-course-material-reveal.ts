import { useLayoutEffect, useRef } from 'react'
import { useSettings } from '@/components/SettingsProvider'

export function useCourseMaterialReveal(lessonId: string) {
  const ref = useRef<HTMLDivElement>(null)
  const { settings } = useSettings()

  useLayoutEffect(() => {
    const container = ref.current
    if (!container) return
    const sections = Array.from(container.children).filter((node): node is HTMLElement => node instanceof HTMLElement && node.tagName === 'SECTION')
    const motionDisabled = !settings.interfaceAnimations || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (motionDisabled || !('IntersectionObserver' in window)) return

    container.dataset.revealReady = 'true'
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
      visible.forEach((entry, index) => {
        const section = entry.target as HTMLElement
        section.style.setProperty('--course-reveal-delay', `${index * 45}ms`)
        section.dataset.revealed = 'true'
        observer.unobserve(section)
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    sections.forEach(section => observer.observe(section))

    return () => {
      observer.disconnect()
      delete container.dataset.revealReady
      sections.forEach(section => {
        delete section.dataset.revealed
        section.style.removeProperty('--course-reveal-delay')
      })
    }
  }, [lessonId, settings.interfaceAnimations])

  return ref
}
