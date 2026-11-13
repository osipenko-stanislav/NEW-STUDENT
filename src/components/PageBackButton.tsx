import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PageBackButton() {
  return <Button type="button" variant="ghost" className="page-back-button" onClick={() => window.history.back()} aria-label="Назад">
    <ArrowLeft aria-hidden="true" />Назад
  </Button>
}
