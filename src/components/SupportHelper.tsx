import { useState } from 'react'
import { LifeBuoy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/** A small local placeholder for the future support helper. */
export default function SupportHelper() {
  const [open, setOpen] = useState(false)
  return <Popover open={open} onOpenChange={setOpen}>
    <Tooltip><TooltipTrigger asChild><PopoverTrigger asChild>
      <Button type="button" variant="outline" size="icon" className="support-helper-trigger" aria-label="Поддержка">
        <LifeBuoy aria-hidden="true" />
      </Button>
    </PopoverTrigger></TooltipTrigger><TooltipContent side="left">Поддержка</TooltipContent></Tooltip>
    <PopoverContent side="top" align="end" sideOffset={12} collisionPadding={16} className="support-helper" aria-labelledby="support-helper-title">
      <header className="support-helper-header"><div className="support-helper-heading"><LifeBuoy aria-hidden="true" /><h2 id="support-helper-title">Поддержка</h2></div>
        <Button type="button" variant="ghost" size="icon" aria-label="Закрыть поддержку" onClick={() => setOpen(false)}><X aria-hidden="true" /></Button>
      </header>
      <div className="support-helper-content"><span className="support-helper-symbol"><LifeBuoy aria-hidden="true" /></span>
        <h3>Привет! Чем помочь?</h3><p>Поможем разобраться с учёбой и сервисами университета.</p>
      </div>
    </PopoverContent>
  </Popover>
}
