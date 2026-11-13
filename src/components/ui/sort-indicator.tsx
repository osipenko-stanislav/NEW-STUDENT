import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { StateIcon } from './state-icon'
export function SortIndicator({ direction }: { direction: 'asc' | 'desc' | null }) { return <StateIcon state={direction ?? 'none'}>{direction === 'asc' ? <ArrowUp /> : direction === 'desc' ? <ArrowDown /> : <ArrowUpDown />}</StateIcon> }
