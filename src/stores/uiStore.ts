import { create } from 'zustand'

interface UIState {
  showLogin: boolean
  showSettings: boolean
  showLyrics: boolean
  setShowLogin: (show: boolean) => void
  setShowSettings: (show: boolean) => void
  setShowLyrics: (show: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  showLogin: false,
  showSettings: false,
  showLyrics: false,
  setShowLogin: (show) => set({ showLogin: show }),
  setShowSettings: (show) => set({ showSettings: show }),
  setShowLyrics: (show) => set({ showLyrics: show }),
}))
