import { useState, useEffect } from 'react'
import { X, Sun, Moon, Monitor, Music, Info, Github, Heart } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/lib/utils'

type PlayQuality = 'standard' | 'high' | 'super' | 'lossless'

const qualityLabels: Record<PlayQuality, string> = {
  standard: '标准',
  high: '较高',
  super: '极高',
  lossless: '无损',
}

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const [playQuality, setPlayQuality] = useState<PlayQuality>(
    () => (localStorage.getItem('playQuality') as PlayQuality) || 'super',
  )

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleQualityChange = (q: PlayQuality) => {
    setPlayQuality(q)
    localStorage.setItem('playQuality', q)
  }

  const themeOptions = [
    { value: 'light' as const, icon: Sun, label: '浅色' },
    { value: 'dark' as const, icon: Moon, label: '深色' },
    { value: 'auto' as const, icon: Monitor, label: '跟随系统' },
  ]

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Settings card */}
      <div
        className="glass-strong relative w-[440px] max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden rounded-2xl shadow-glass-lg animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4 dark:border-white/10">
          <h2 className="text-lg font-bold">设置</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-black/5 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto scrollbar-thin px-6 py-5" style={{ maxHeight: 'calc(85vh - 65px)' }}>
          {/* Appearance */}
          <section className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
              外观
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 py-4 transition-all',
                    theme === value
                      ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                      : 'border-transparent bg-black/5 text-gray-500 hover:bg-black/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10',
                  )}
                >
                  <Icon size={22} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Playback */}
          <section className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
              播放
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-black/5 px-4 py-3 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <Music size={16} className="text-gray-400" />
                  <span className="text-sm">音质选择</span>
                </div>
                <select
                  value={playQuality}
                  onChange={(e) => handleQualityChange(e.target.value as PlayQuality)}
                  className="rounded-lg border border-black/10 bg-transparent px-3 py-1.5 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                >
                  {Object.entries(qualityLabels).map(([value, label]) => (
                    <option key={value} value={value} className="dark:bg-gray-800">
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
              关于
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-xl bg-black/5 px-4 py-3 dark:bg-white/5">
                <Info size={16} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">JerryMusic</p>
                  <p className="text-xs text-gray-400">v1.0.0 - 独立音乐站</p>
                </div>
              </div>
              <a
                href="https://jerrynis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl bg-black/5 px-4 py-3 transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <Github size={16} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">jerrynis.com</p>
                  <p className="text-xs text-gray-400">访问作者博客</p>
                </div>
              </a>
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary-500/10 to-sky-500/10 px-4 py-3">
                <Heart size={16} className="text-primary-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  基于 SPlayer 灵感，使用 React + Tailwind CSS 构建
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
