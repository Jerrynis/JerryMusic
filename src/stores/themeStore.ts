import { create } from 'zustand'
import { generatePalette, applyPrimaryPalette, resetDynamicBackground } from '@/lib/color'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  accentColor: string
  dynamicColor: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  resolveTheme: () => 'light' | 'dark'
  setAccentColor: (color: string) => void
  setDynamicColor: (enabled: boolean) => void
}

const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved
  return 'auto'
}

const getInitialAccentColor = (): string => {
  return localStorage.getItem('accentColor') || '#3b82f6'
}

const getInitialDynamicColor = (): boolean => {
  return localStorage.getItem('dynamicColor') === 'true'
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  resolvedTheme: getInitialTheme() === 'auto' ? getSystemTheme() : (getInitialTheme() as 'light' | 'dark'),
  accentColor: getInitialAccentColor(),
  dynamicColor: getInitialDynamicColor(),
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
  setAccentColor: (color) => {
    set({ accentColor: color })
    localStorage.setItem('accentColor', color)
    // When user manually picks a color, disable dynamic mode
    if (get().dynamicColor) {
      set({ dynamicColor: false })
      localStorage.setItem('dynamicColor', 'false')
    }
    applyPrimaryPalette(generatePalette(color))
  },
  setDynamicColor: (enabled) => {
    set({ dynamicColor: enabled })
    localStorage.setItem('dynamicColor', String(enabled))
    // When disabling dynamic color, restore the saved accent color and reset bg
    if (!enabled) {
      applyPrimaryPalette(generatePalette(get().accentColor))
      resetDynamicBackground()
    }
  },
}))

// Apply saved accent color on initial load
applyPrimaryPalette(generatePalette(getInitialAccentColor()))
