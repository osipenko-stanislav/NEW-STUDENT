import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import RescuePlanner from './RescuePlanner'
export default function RescueButton() {
  const [planId, setPlanId] = useState<string | null>(null)
  return <><Button variant="outline" className="late-days-rescue-button" onClick={() => setPlanId(crypto.randomUUID())}>🔥 Спасти дедлайны</Button>
    <Dialog open={!!planId} onOpenChange={open => { if (!open) setPlanId(null) }}><DialogContent className="late-days-dialog late-days-bulk-dialog"><DialogHeader><DialogTitle>Перенос дедлайнов</DialogTitle><DialogDescription>Late Days помогают освободить время для важных заданий. Подготовь план и подтверди его.</DialogDescription></DialogHeader>{planId ? <RescuePlanner key={planId} planId={planId} /> : null}</DialogContent></Dialog>
  </>
}
