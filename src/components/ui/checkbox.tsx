import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
export const Checkbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { indeterminate?: boolean }>(
  ({ className, indeterminate = false, ...props }, ref) => {
    const input = useRef<HTMLInputElement>(null)
    useImperativeHandle(ref, () => input.current!)
    useLayoutEffect(() => { if (input.current) input.current.indeterminate = indeterminate }, [indeterminate])
    return <span className={cn('checkbox-control', className)}><input ref={input} type="checkbox" data-slot="checkbox" {...props} /><svg aria-hidden="true" viewBox="0 0 16 16" className="checkbox-mark"><path className="checkbox-tick" d="m3.5 8 3 3 6-6" /><path className="checkbox-mixed" d="M4 8h8" /></svg></span>
  },
)
Checkbox.displayName = 'Checkbox'
