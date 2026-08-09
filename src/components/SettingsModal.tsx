import { useState, useEffect } from 'react'
import { X, Sun, Moon, Monitor, Music, Info, Github, Heart, Palette, Sparkles } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/lib/utils'

type PlayQuality = 'standard' | 'high' | 'super' | 'lossless'

const qualityLabels: Record<PlayQuality, string> = {
  standard: '标准',
  high: '较高',
  super: '极高',
  lossless: '无损',
}

const presetColors = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
]

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const accentColor = useThemeStore((s) => s.accentColor)
  const setAccentColor = useThemeStore((s) => s.setAccentColor)
  const dynamicColor = useThemeStore((s) => s.dynamicColor)
  const setDynamicColor = useThemeStore((s) => s.setDynamicColor)

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

          {/* Theme Color */}
          <section className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
              <Palette size={14} />
              主题色
            </h3>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  className={cn(
                    'h-9 w-9 rounded-full transition-all hover:scale-110',
                    accentColor.toLowerCase() === color.toLowerCase() && !dynamicColor
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                      : '',
                  )}
                  style={{
                    backgroundColor: color,
                    // @ts-expect-error CSS custom property
                    '--tw-ring-color': color,
                  }}
                />
              ))}
              {/* Custom color picker */}
              <label
                className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 transition-all hover:scale-110 dark:border-gray-600"
                title="自定义颜色"
              >
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <Palette size={14} className="text-gray-400" />
              </label>
            </div>

            {/* Dynamic color toggle */}
            <button
              onClick={() => setDynamicColor(!dynamicColor)}
              className="mt-3 flex w-full items-center justify-between rounded-xl bg-black/5 px-4 py-3 transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className={cn(dynamicColor ? 'text-primary-500' : 'text-gray-400')} />
                <div className="text-left">
                  <p className="text-sm font-medium">动态取色</p>
                  <p className="text-xs text-gray-400">从当前播放封面提取主题色</p>
                </div>
              </div>
              <div
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  dynamicColor ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600',
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all',
                    dynamicColor ? 'left-[22px]' : 'left-0.5',
                  )}
                />
              </div>
            </button>
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
