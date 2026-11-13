import { useLayoutEffect, type RefObject } from 'react'

export function useContentReveal(containerRef: RefObject<HTMLElement | null>, dependency: unknown) {
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const blocks = Array.from(container.children).filter((node): node is HTMLElement => node instanceof HTMLElement)
    if (!blocks.length) return

    const minimal = document.documentElement.dataset.motionLevel === 'minimal'
    if (minimal || !('IntersectionObserver' in window)) {
      blocks.forEach(block => { block.dataset.contentReveal = 'visible' })
      return () => blocks.forEach(block => { delete block.dataset.contentReveal })
    }

    blocks.forEach((block, index) => {
      block.dataset.contentReveal = 'pending'
      block.style.setProperty('--content-reveal-order', String(Math.min(index, 3)))
    })
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const block = entry.target as HTMLElement
        block.dataset.contentReveal = 'visible'
        observer.unobserve(block)
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' })
    blocks.forEach(block => observer.observe(block))

    return () => {
      observer.disconnect()
      blocks.forEach(block => {
        delete block.dataset.contentReveal
        block.style.removeProperty('--content-reveal-order')
      })
    }
  }, [containerRef, dependency])
}
