import { useEffect, useLayoutEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type Theme = 'system' | 'light' | 'dark'
const storageKey = 'student-theme:v1'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const value = localStorage.getItem(storageKey)
      return value === 'dark' || value === 'light' ? value : 'system'
    } catch {
      return 'system'
    }
  })

  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [error, setError] = useState<string | null>(null)
  const resolvedTheme = theme === 'system' ? systemDark ? 'dark' : 'light' : theme
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(media.matches)
    media.addEventListener('change', update)
    update()
    return () => media.removeEventListener('change', update)
  }, [])
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    document.documentElement.dataset.theme = theme
  }, [resolvedTheme, theme])
  function changeTheme(next: Theme) {
    try {
      localStorage.setItem(storageKey, next)
      setTheme(next)
      setError(null)
    } catch {
      setTheme(next)
      setError('Тема изменена, но сохранить ее не удалось. Проверь доступ к хранилищу браузера.')
    }
  }

  return [theme, changeTheme, resolvedTheme, error] as const
}

export default function ThemeSwitcher({ theme, onChange }: { theme: 'light' | 'dark'; onChange: (theme: Theme) => void }) {
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
