import type { AnchorHTMLAttributes } from 'react'
import { navigate } from '@/hooks/use-navigation'

/** Ordinary activation opens the stored copy inside the LMS. The URL remains
 * a fallback for the browser's explicit open-in-new-tab gesture. */
export default function AcademicMaterialLink({ material, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { material: { id: string; url: string } }) {
  return <a {...props} href={`${import.meta.env.BASE_URL}${material.url}`} onClick={event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate({ materialId: material.id }, true)
  }} />
}
