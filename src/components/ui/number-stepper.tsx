import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { InputHTMLAttributes } from 'react'
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & { value: string | number; onValueChange: (value: string) => void; min?: number; max?: number }
export function NumberStepper({ value, onValueChange, min = 1, max = 366, disabled, ...props }: Props) {
  const amount = Number(value)
  const context = props['aria-label'] ? `: ${props['aria-label']}` : ''
  return <span className="number-stepper"><Button type="button" variant="ghost" size="icon" disabled={disabled || !Number.isFinite(amount) || amount <= min} aria-label={`Уменьшить количество дней${context}`} onClick={() => onValueChange(String(Math.max(min, amount - 1)))}><Minus aria-hidden="true" /></Button>
    <Input {...props} type="number" min={min} max={max} step={1} value={value} disabled={disabled} onChange={event => onValueChange(event.target.value)} />
    <Button type="button" variant="ghost" size="icon" disabled={disabled || !Number.isFinite(amount) || amount >= max} aria-label={`Увеличить количество дней${context}`} onClick={() => onValueChange(String(Math.min(max, Math.max(min - 1, amount) + 1)))}><Plus aria-hidden="true" /></Button>
  </span>
}
