import { createContext, useContext, useState, type ReactNode } from 'react'
import { MaterialLibrary } from '@/lib/material-library'
const Context = createContext<MaterialLibrary | null>(null)
export function MaterialLibraryProvider({ children }: { children: ReactNode }) {
  const [library] = useState(() => new MaterialLibrary())
  return <Context.Provider value={library}>{children}</Context.Provider>
}
export function useMaterialLibrary() {
  const library = useContext(Context)
  if (!library) throw new Error('MaterialLibraryProvider is required')
  return library
}
