import { formatGrade } from '@/lib/grade-calculation'
import { AnimatedNumber } from './animated-number'
export function GradeValue({ value }: { value: number | null }) { return value === null ? <>—</> : <AnimatedNumber value={value} formatValue={formatGrade} /> }
