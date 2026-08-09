import { useRef, useEffect, useState } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  Shuffle,
  Repeat,
  Repeat1,
  Loader2,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { useUIStore } from '@/stores/uiStore'
import { formatTime, getArtistNames, cn, normalizeImageUrl } from '@/lib/utils'
import type { PlayMode } from '@/types'

const playModeIcon: Record<PlayMode['type'], React.ReactNode> = {
  order: <Repeat size={20} />,
  repeat: <Repeat size={20} />,
  single: <Repeat1 size={20} />,
  shuffle: <Shuffle size={20} />,
}

export default function Lyrics() {
  const setShowLyrics = useUIStore((s) => s.setShowLyrics)
  const lyricScrollRef = useRef<HTMLDivElement>(null)
  const [showVolume, setShowVolume] = useState(false)

  const currentSong = usePlayerStore((s) => s.currentSong)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const lyrics = usePlayerStore((s) => s.lyrics)
  const currentLyricIndex = usePlayerStore((s) => s.currentLyricIndex)
  const playMode = usePlayerStore((s) => s.playMode)
  const isLoadingUrl = usePlayerStore((s) => s.isLoadingUrl)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)

  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const seek = usePlayerStore((s) => s.seek)
  const cyclePlayMode = usePlayerStore((s) => s.cyclePlayMode)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleMute = usePlayerStore((s) => s.toggleMute)

  // Auto-scroll lyrics to center
  useEffect(() => {
    if (currentLyricIndex < 0) return
    const container = lyricScrollRef.current
    if (!container) return
    const activeEl = container.querySelector(`[data-lyric-index="${currentLyricIndex}"]`)
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentLyricIndex])

  const cover = normalizeImageUrl(currentSong?.album?.picUrl)
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const volumePercent = (muted ? 0 : volume) * 100

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const percent = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1))
    seek(percent * duration)
  }

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const percent = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1))
    setVolume(percent)
  }

  const handleLyricClick = (time: number) => {
    seek(time)
  }

  // No song playing
  if (!currentSong) {
    return (
      <div
        className="fullscreen-enter fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4"
        style={{ background: 'var(--bg-primary)' }}
      >
        <img
          src="https://img.jerry-nis.top/d8703c5c-4c4a-49cc-bd94-3363c9eda2d8.png"
          alt="JerryMusic"
          className="h-20 w-20 rounded-2xl object-cover opacity-50"
        />
        <p className="text-sm text-gray-400">暂无播放内容</p>
        <button
          onClick={() => setShowLyrics(false)}
          className="rounded-full bg-primary-500 px-6 py-2 text-sm text-white hover:bg-primary-600"
        >
          返回
        </button>
      </div>
    )
  }

  return (
    <div
      className="fullscreen-enter fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Dynamic blurred album art background */}
      {cover && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={cover}
            alt=""
            className="animate-cover-breathe h-full w-full scale-125 object-cover"
            style={{ filter: 'blur(60px) brightness(0.4) saturate(1.5)' }}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(37, 99, 235, 0.12) 0%, transparent 60%)',
            }}
          />
        </div>
      )}
      {!cover && (
        <div className="absolute inset-0 z-0" style={{ background: 'var(--bg-primary)' }} />
      )}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <button
          onClick={() => setShowLyrics(false)}
          className="glass btn-icon h-10 w-10 text-white/70 hover:text-white"
        >
          <ChevronDown size={22} />
        </button>
        <div className="text-center">
          <p className="line-clamp-1 text-sm font-semibold text-white">{currentSong.name}</p>
          <p className="line-clamp-1 text-xs text-white/50">{getArtistNames(currentSong.artists)}</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Main content: left cover, right lyrics */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Left: Square album cover */}
        <div className="hidden flex-col items-center justify-center gap-8 p-8 lg:flex lg:w-[45%]">
          <div className="animate-scale-blur">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl" style={{ width: '300px', height: '300px' }}>
              {cover ? (
                <img src={cover} alt={currentSong.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-800">
                  <Play size={48} className="text-gray-600" />
                </div>
              )}
            </div>
          </div>

          {/* Song info below cover */}
          <div className="text-center">
            <h1 className="line-clamp-2 text-2xl font-bold text-white">{currentSong.name}</h1>
            <p className="mt-1 text-sm text-white/60">{getArtistNames(currentSong.artists)}</p>
            {currentSong.album?.name && (
              <p className="mt-0.5 text-xs text-white/40">{currentSong.album.name}</p>
            )}
          </div>
        </div>

        {/* Right: Lyrics */}
        <div className="flex flex-1 flex-col">
          {/* Lyrics scroll area */}
          <div
            ref={lyricScrollRef}
            className="flex-1 overflow-y-auto scrollbar-thin"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            }}
          >
            {/* Top padding for centering first lyric */}
            <div className="h-[30vh]" />

            {lyrics.length > 0 ? (
              lyrics.map((line, index) => {
                const isActive = index === currentLyricIndex
                const distance = Math.abs(index - currentLyricIndex)
                return (
                  <div
                    key={index}
                    data-lyric-index={index}
                    onClick={() => handleLyricClick(line.time)}
                    className={cn(
                      'cursor-pointer py-3 px-4 text-center transition-all duration-500 ease-out sm:px-8',
                      isActive
                        ? 'text-2xl font-bold text-white scale-100 opacity-100'
                        : distance <= 2
                        ? 'text-lg text-white/40 scale-95 opacity-60'
                        : 'text-base text-white/25 scale-90 opacity-30',
                    )}
                    style={{
                      transitionProperty: 'opacity, transform, color, font-size',
                    }}
                  >
                    <p>{line.text}</p>
                    {line.translation && isActive && (
                      <p className="mt-1 text-sm font-normal opacity-70">{line.translation}</p>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="flex h-[40vh] items-center justify-center text-sm text-white/40">
                暂无歌词
              </div>
            )}

            {/* Bottom padding */}
            <div className="h-[30vh]" />
          </div>

          {/* Mobile cover (shown when left panel hidden) */}
          <div className="flex items-center justify-center gap-4 px-6 py-3 lg:hidden">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
              {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-medium text-white">{currentSong.name}</p>
              <p className="line-clamp-1 text-xs text-white/50">{getArtistNames(currentSong.artists)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls - floating glass style */}
      <div className="relative z-10 px-4 pb-3 sm:px-8 sm:pb-4">
        <div className="glass-strong mx-auto max-w-xl rounded-2xl px-4 py-3 shadow-glass-lg sm:px-6 sm:py-4">
        {/* Progress bar */}
        <div className="mb-3 flex items-center gap-3">
          <span className="w-12 flex-shrink-0 text-right text-xs tabular-nums text-white/50">
            {formatTime(currentTime)}
          </span>
          <div
            onClick={handleProgressClick}
            className="group relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/15"
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-primary-400 transition-[width] duration-150"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
          <span className="w-12 flex-shrink-0 text-xs tabular-nums text-white/50">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          <button
            onClick={cyclePlayMode}
            className={cn(
              'btn-icon h-9 w-9',
              playMode !== 'order' ? 'text-primary-400' : 'text-white/40 hover:text-white/70',
            )}
          >
            {playModeIcon[playMode]}
          </button>

          <button
            onClick={prev}
            className="btn-icon h-9 w-9 text-white/70 hover:text-white"
          >
            <SkipBack size={20} className="fill-current" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isLoadingUrl}
            className="btn-icon h-9 w-9 bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 shadow-md"
          >
            {isLoadingUrl ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={18} className="fill-current" />
            ) : (
              <Play size={18} className="ml-0.5 fill-current" />
            )}
          </button>

          <button
            onClick={next}
            className="btn-icon h-9 w-9 text-white/70 hover:text-white"
          >
            <SkipForward size={20} className="fill-current" />
          </button>

          {/* Volume control - hidden on mobile (no hover on touch) */}
          <div
            className="hidden items-center gap-2 sm:flex"
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
          >
            <button
              onClick={toggleMute}
              className="btn-icon h-9 w-9 text-white/40 hover:text-white/70"
            >
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                showVolume ? 'w-20 opacity-100' : 'w-0 opacity-0',
              )}
            >
              <div
                onClick={handleVolumeChange}
                className="group relative h-1.5 w-full cursor-pointer rounded-full bg-white/15"
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-primary-400"
                  style={{ width: `${volumePercent}%` }}
                />
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md"
                  style={{ left: `${volumePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
