import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  resolveTheme: () => 'light' | 'dark'
}

const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved
  return 'auto'
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  resolvedTheme: getInitialTheme() === 'auto' ? getSystemTheme() : (getInitialTheme() as 'light' | 'dark'),
  resolveTheme: () => {
    const t = get().theme
    return t === 'auto' ? getSystemTheme() : t
  },
  toggleTheme: () => {
    const order: Theme[] = ['light', 'dark', 'auto']
    const current = get().theme
    const next = order[(order.indexOf(current) + 1) % order.length]
    const resolved = next === 'auto' ? getSystemTheme() : next
    set({ theme: next, resolvedTheme: resolved })
    localStorage.setItem('theme', next)
  },
  setTheme: (theme) => {
    const resolved = theme === 'auto' ? getSystemTheme() : theme
    set({ theme, resolvedTheme: resolved })
    localStorage.setItem('theme', theme)
  },
}))
