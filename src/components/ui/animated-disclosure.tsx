import { useState, type ReactNode } from 'react'
export function AnimatedDisclosure({ open, children }: { open: boolean; children: ReactNode }) {
  const [visited, setVisited] = useState(open)
  if (open && !visited) setVisited(true)
  return <div className="animated-disclosure" data-open={open} aria-hidden={!open} inert={!open}><div>{visited ? children : null}</div></div>
}
