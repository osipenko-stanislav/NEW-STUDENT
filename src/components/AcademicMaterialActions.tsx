import { createContext, useContext, type ReactNode } from 'react'
type Actions = { addToChat: (id: string) => Promise<boolean>; pendingId: string | null; error: string | null }
const Context = createContext<Actions | null>(null)
export function AcademicMaterialActionsProvider({ children, ...value }: Actions & { children: ReactNode }) { return <Context.Provider value={value}>{children}</Context.Provider> }
export function useAcademicMaterialActions() { return useContext(Context) }
