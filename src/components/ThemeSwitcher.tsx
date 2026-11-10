import { useLayoutEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark'
const storageKey = 'student-theme:v1'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(storageKey, theme)
    } catch {
      // Theme switching remains available when browser storage is disabled.
    }
  }, [theme])

  return [theme, setTheme] as const
}

export default function ThemeSwitcher({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  return <div className="theme-switcher" role="group" aria-label="Тема интерфейса">
      <Button type="button" variant="ghost" size="sm" className="theme-option"
        aria-label="Светлая" aria-pressed={theme === 'light'} onClick={() => onChange('light')}>
        <Sun aria-hidden="true" /><span>Светлая</span>
      </Button>
      <Button type="button" variant="ghost" size="sm" className="theme-option"
        aria-label="Тёмная" aria-pressed={theme === 'dark'} onClick={() => onChange('dark')}>
        <Moon aria-hidden="true" /><span>Тёмная</span>
      </Button>
  </div>
}
