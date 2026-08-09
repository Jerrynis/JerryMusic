import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Settings, LogIn } from 'lucide-react'
import { useThemeStore } from './stores/themeStore'
import { useUserStore } from './stores/userStore'
import { useUIStore } from './stores/uiStore'
import { usePlayerStore } from './stores/playerStore'
import { reapplyDynamicBackground } from './lib/color'
import Sidebar from './components/Sidebar'
import Player from './components/Player'
import MobileNav from './components/MobileNav'
import LoginModal from './components/LoginModal'
import SettingsModal from './components/SettingsModal'
import OOBE, { hasAcceptedOOBE } from './components/OOBE'
import Home from './pages/Home'
import Search from './pages/Search'
import PlaylistDetail from './pages/PlaylistDetail'
import Profile from './pages/Profile'
import Explore from './pages/Explore'
import Lyrics from './pages/Lyrics'
import { normalizeImageUrl } from './lib/utils'

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)

  useEffect(() => {
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    // Re-apply dynamic background so it matches the new theme mode
    reapplyDynamicBackground(resolvedTheme === 'dark')
  }, [resolvedTheme])

  useEffect(() => {
    if (theme !== 'auto') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      useThemeStore.getState().setTheme('auto')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return <>{children}</>
}

function MobileHeader() {
  const isLogin = useUserStore((s) => s.isLogin)
  const profile = useUserStore((s) => s.profile)
  const setShowLogin = useUIStore((s) => s.setShowLogin)
  const setShowSettings = useUIStore((s) => s.setShowSettings)

  return (
    <header className="glass-strong sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden">
      <div className="flex items-center gap-2">
        <img
          src="https://img.jerry-nis.top/d8703c5c-4c4a-49cc-bd94-3363c9eda2d8.png"
          alt="JerryMusic"
          className="h-8 w-8 rounded-lg object-cover"
        />
        <span className="text-gradient text-base font-bold">JerryMusic</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowSettings(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10"
        >
          <Settings size={20} />
        </button>
        {isLogin && profile ? (
          <img
            src={normalizeImageUrl(profile.avatarUrl)}
            alt={profile.nickname}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <button
            onClick={() => setShowLogin(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary-500 px-3 py-1.5 text-xs font-medium text-white"
          >
            <LogIn size={14} />
            登录
          </button>
        )}
      </div>
    </header>
  )
}

function AppContent() {
  const checkLogin = useUserStore((s) => s.checkLogin)
  const showLogin = useUIStore((s) => s.showLogin)
  const showSettings = useUIStore((s) => s.showSettings)
  const showLyrics = useUIStore((s) => s.showLyrics)
  const setShowLogin = useUIStore((s) => s.setShowLogin)
  const setShowSettings = useUIStore((s) => s.setShowSettings)
  const restoreState = usePlayerStore((s) => s.restoreState)

  const [showOOBE, setShowOOBE] = useState(() => !hasAcceptedOOBE())

  useEffect(() => {
    checkLogin()
  }, [checkLogin])

  // Restore player state on mount if OOBE was already accepted
  useEffect(() => {
    if (!showOOBE) {
      restoreState()
    }
  }, [showOOBE, restoreState])

  const handleOOBEAccept = () => {
    setShowOOBE(false)
    restoreState()
  }

  return (
    <div
      className="relative z-10 flex h-screen w-screen overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 15% 20%, rgba(59, 130, 246, 0.22) 0%, transparent 50%), radial-gradient(circle at 85% 80%, rgba(37, 99, 235, 0.18) 0%, transparent 50%), var(--bg-primary)',
      }}
    >
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto scrollbar-thin pb-28 lg:pb-28">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/playlist/:id" element={<PlaylistDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/explore" element={<Explore />} />
          </Routes>
        </main>
        <Player />
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />

      {/* Modals - rendered at top level to ensure proper centering */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Lyrics overlay - renders on top of current page without unmounting it */}
      {showLyrics && <Lyrics />}

      {/* OOBE - first visit welcome */}
      {showOOBE && <OOBE onAccept={handleOOBEAccept} />}
    </div>
  )
}

export default function App() {
  return (
    <ThemeWrapper>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeWrapper>
  )
}
