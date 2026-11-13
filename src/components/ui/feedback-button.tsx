import { AnimatedLabel } from './animated-status'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, LoaderCircle, TriangleAlert } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { StateIcon } from '@/components/ui/state-icon'
import { feedbackHold } from '@/lib/motion-tokens'
export type ActionState = 'idle' | 'loading' | 'success' | 'error'
type FeedbackProps = Omit<ButtonProps, 'children'> & { state: ActionState; label: string; loadingLabel?: string; successLabel?: string; errorLabel?: string; icon?: ReactNode }
/** All labels reserve a shared footprint; the action itself controls the state. */
export function FeedbackButton({ state, label, loadingLabel = label, successLabel = label, errorLabel = label, icon, disabled, type = 'button', ...props }: FeedbackProps) {
  const labels = { idle: label, loading: loadingLabel, success: successLabel, error: errorLabel }
  return <Button {...props} type={type} disabled={disabled || state === 'loading'} aria-busy={state === 'loading'} data-feedback-state={state}>
    <StateIcon state={state}>{state === 'loading' ? <LoaderCircle className="action-spinner" /> : state === 'success' ? <Check /> : state === 'error' ? <TriangleAlert /> : icon}</StateIcon>
    {props.size !== 'icon' ? <AnimatedLabel value={labels[state]} choices={Object.values(labels)} pattern="action" /> : null}
  </Button>
}
export function useActionFeedback() {
  const [state, setState] = useState<ActionState>('idle')
  const busy = useRef(false)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => { if (state === 'success') { const timer = setTimeout(() => setState('idle'), feedbackHold); return () => clearTimeout(timer) } }, [state])
  async function run(action: () => Promise<boolean>) {
    if (busy.current) return
    busy.current = true
    setState('loading')
    try { const ok = await action(); if (alive.current) setState(ok ? 'success' : 'error') }
    catch { if (alive.current) setState('error') }
    finally { busy.current = false }
  }
  return { state, run }
}
export function AsyncButton({ action, ...props }: Omit<FeedbackProps, 'state' | 'onClick'> & { action: () => Promise<boolean> }) {
  const { state, run } = useActionFeedback()
  return <FeedbackButton {...props} state={state} onClick={() => void run(action)} />
}
