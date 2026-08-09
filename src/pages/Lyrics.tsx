import { useRef, useEffect, useState, useMemo } from 'react'
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
  Music2,
} from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { useUIStore } from '@/stores/uiStore'
import { formatTime, getArtistNames, cn, normalizeImageUrl } from '@/lib/utils'
import type { PlayMode } from '@/types'

const playModeIcon: Record<PlayMode['type'], React.ReactNode> = {
  order: <Repeat size={18} />,
  repeat: <Repeat size={18} />,
  single: <Repeat1 size={18} />,
  shuffle: <Shuffle size={18} />,
}

function splitChars(text: string): string[] {
  return [...text]
}

function getCharHighlight(chars: string[], elapsed: number, lineDuration: number) {
  if (lineDuration <= 0 || elapsed <= 0) return -1
  const progress = Math.min(elapsed / lineDuration, 1)
  return Math.floor(progress * chars.length)
}

function smoothScrollTo(
  container: HTMLElement,
  target: number,
  duration: number,
  animRef: React.MutableRefObject<number | null>,
) {
  if (animRef.current !== null) cancelAnimationFrame(animRef.current)
  const start = container.scrollTop
  const distance = target - start
  if (Math.abs(distance) < 1) return
  const startTime = performance.now()
  const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  const step = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1)
    container.scrollTop = start + distance * ease(progress)
    if (progress < 1) {
      animRef.current = requestAnimationFrame(step)
    } else {
      animRef.current = null
    }
  }
  animRef.current = requestAnimationFrame(step)
}

export default function Lyrics() {
  const setShowLyrics = useUIStore((s) => s.setShowLyrics)
  const lyricScrollRef = useRef<HTMLDivElement>(null)
  const scrollAnimRef = useRef<number | null>(null)
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

  const lineDurations = useMemo(() => {
    return lyrics.map((line, i) => {
      const nextLine = lyrics[i + 1]
      return nextLine ? nextLine.time - line.time : 4
    })
  }, [lyrics])

  // Scroll current lyric into view using layout offset (avoids 3D transform interference)
  useEffect(() => {
    if (currentLyricIndex < 0) return
    const container = lyricScrollRef.current
    if (!container) return
    const activeEl = container.querySelector(
      `[data-lyric-index="${currentLyricIndex}"]`,
    ) as HTMLElement | null
    if (!activeEl) return
    const containerRect = container.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    const offset = activeRect.top - containerRect.top
    const targetScroll = container.scrollTop + offset - container.clientHeight * 0.35
    smoothScrollTo(container, Math.max(0, targetScroll), 700, scrollAnimRef)
  }, [currentLyricIndex])

  // Auto-hide bottom controls: fade out after 3s, fade in on mouse hover at bottom
  const [controlsVisible, setControlsVisible] = useState(true)
  const inZoneRef = useRef(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const ZONE_HEIGHT = 160
    const startHideTimer = () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      hideTimerRef.current = setTimeout(() => {
        if (!inZoneRef.current) setControlsVisible(false)
      }, 3000)
    }
    const handleMouseMove = (e: MouseEvent) => {
      const wasInZone = inZoneRef.current
      inZoneRef.current = e.clientY > window.innerHeight - ZONE_HEIGHT
      if (inZoneRef.current) {
        setControlsVisible(true)
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current)
          hideTimerRef.current = null
        }
      } else if (wasInZone) {
        startHideTimer()
      }
    }
    startHideTimer()
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

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

  // No song
  if (!currentSong) {
    return (
      <div
        className="fullscreen-enter fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4"
        style={{ background: '#0a0a0f' }}
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
      style={{ background: '#0a0a0f' }}
    >
      {/* Blurred album art background */}
      {cover && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={cover}
            alt=""
            className="animate-cover-breathe h-full w-full scale-150 object-cover"
            style={{ filter: 'blur(80px) brightness(0.35) saturate(1.8)' }}
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}
      {!cover && (
        <div className="absolute inset-0 z-0" style={{ background: '#0a0a0f' }} />
      )}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <button
          onClick={() => setShowLyrics(false)}
          className="btn-icon h-10 w-10 text-white/60 hover:text-white"
        >
          <ChevronDown size={22} />
        </button>
        <div className="w-10" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* ============ LEFT: Cover + Info (50%) ============ */}
        <div className="hidden flex-col items-center justify-center gap-10 p-8 md:flex md:w-1/2">
          <div className="animate-scale-blur">
            <div className="relative overflow-hidden rounded-3xl shadow-2xl" style={{ width: 'clamp(320px, 45vh, 560px)', height: 'clamp(320px, 45vh, 560px)' }}>
              {cover ? (
                <img src={cover} alt={currentSong.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-800">
                  <Music2 size={64} className="text-gray-600" />
                </div>
              )}
            </div>
          </div>

          <div className="text-center" style={{ maxWidth: 'clamp(320px, 45vh, 560px)' }}>
            <h1 className="line-clamp-2 font-bold text-white" style={{ fontSize: 'clamp(1.75rem, 4vh, 3rem)' }}>{currentSong.name}</h1>
            <p className="mt-4 text-white/50" style={{ fontSize: 'clamp(1rem, 2.5vh, 1.5rem)' }}>{getArtistNames(currentSong.artists)}</p>
            {currentSong.album?.name && (
              <p className="mt-2 text-white/35" style={{ fontSize: 'clamp(0.9rem, 2.2vh, 1.25rem)' }}>{currentSong.album.name}</p>
            )}
          </div>
        </div>

        {/* ============ RIGHT: Lyrics (50%) ============ */}
        <div className="flex flex-1 flex-col md:w-1/2">
          <div
            ref={lyricScrollRef}
            className="relative flex-1 overflow-y-auto scrollbar-none"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 94%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 94%, transparent 100%)',
            }}
          >
            <div>
              <div className="h-[12vh] md:h-[16vh]" />

              {lyrics.length > 0 ? (
                lyrics.map((line, index) => {
                  const isActive = index === currentLyricIndex
                  const isBefore = index < currentLyricIndex
                  const isAfter = index > currentLyricIndex
                  const distance = Math.abs(index - currentLyricIndex)

                  const fadeOpacity = isBefore
                    ? Math.max(0.04, 1 - distance * 0.28)
                    : isAfter
                    ? Math.max(0.1, 1 - distance * 0.22)
                    : 1

                  // Simple blur depth (no 3D transform)
                  const depthBlur = isActive
                    ? 0
                    : Math.min(distance * 1.5, 6)
                  // Vertical slide offset for switch animation
                  const yOffset = isActive ? 0 : isBefore ? -12 : 12

                  const chars = splitChars(line.text)
                  const lineDuration = lineDurations[index]
                  const elapsed = currentTime - line.time
                  const highlightIndex = isActive
                    ? getCharHighlight(chars, elapsed, lineDuration)
                    : -1

                  return (
                    <div
                      key={index}
                      data-lyric-index={index}
                      onClick={() => handleLyricClick(line.time)}
                      className="cursor-pointer py-3 pl-12 pr-8 md:py-4 md:pl-16 md:pr-12"
                      style={{
                        opacity: fadeOpacity,
                        transform: `translateY(${yOffset}px)`,
                        filter: depthBlur > 0 ? `blur(${depthBlur}px)` : 'none',
                        transition: 'opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), filter 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)',
                      }}
                    >
                      {isActive ? (
                        <p className="font-bold leading-relaxed" style={{ fontSize: 'clamp(1.5rem, 3.8vh, 2.8rem)' }}>
                          {chars.map((char, ci) => (
                            <span
                              key={ci}
                              className={cn(
                                'transition-colors duration-300',
                                ci < highlightIndex ? 'text-primary-400' : 'text-white',
                              )}
                            >
                              {char}
                            </span>
                          ))}
                        </p>
                      ) : (
                        <p className="font-bold leading-relaxed text-white" style={{ fontSize: 'clamp(1.5rem, 3.8vh, 2.8rem)' }}>
                          {line.text}
                        </p>
                      )}
                      {line.translation && isActive && (
                        <p className="mt-3 text-sm font-normal text-white/45 md:text-base">
                          {line.translation}
                        </p>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="flex h-[40vh] items-center justify-center text-base text-white/30">
                  暂无歌词
                </div>
              )}

              <div className="h-[40vh]" />
            </div>
          </div>

          {/* Mobile: cover + info bar at bottom of lyrics area */}
          <div className="flex items-center gap-4 border-t border-white/5 px-6 py-4 md:hidden">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
              {cover && (
                <img src={cover} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-base font-bold text-white">{currentSong.name}</p>
              <p className="line-clamp-1 text-xs text-white/50">{getArtistNames(currentSong.artists)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="relative z-10 px-4 pb-5 transition-all duration-500 ease-out sm:px-8 sm:pb-6"
        style={{
          opacity: controlsVisible ? 1 : 0,
          transform: controlsVisible ? 'translateY(0)' : 'translateY(16px)',
          pointerEvents: controlsVisible ? 'auto' : 'none',
        }}
      >
        <div className="glass-strong mx-auto max-w-2xl rounded-2xl px-5 py-4 shadow-glass-lg">
          <div className="mb-3 flex items-center gap-3">
            <span className="w-10 flex-shrink-0 text-right text-xs tabular-nums text-white/40">
              {formatTime(currentTime)}
            </span>
            <div
              onClick={handleProgressClick}
              className="group relative h-1 flex-1 cursor-pointer rounded-full bg-white/10"
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-primary-400 transition-[width] duration-150"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
            <span className="w-10 flex-shrink-0 text-xs tabular-nums text-white/40">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={cyclePlayMode}
              className={cn(
                'btn-icon h-8 w-8',
                playMode !== 'order' ? 'text-primary-400' : 'text-white/40 hover:text-white/70',
              )}
            >
              {playModeIcon[playMode]}
            </button>
            <button onClick={prev} className="btn-icon h-9 w-9 text-white/80 hover:text-white">
              <SkipBack size={20} className="fill-current" />
            </button>
            <button
              onClick={togglePlay}
              disabled={isLoadingUrl}
              className="btn-icon h-11 w-11 bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 shadow-lg"
            >
              {isLoadingUrl ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={20} className="fill-current" />
              ) : (
                <Play size={20} className="ml-0.5 fill-current" />
              )}
            </button>
            <button onClick={next} className="btn-icon h-9 w-9 text-white/80 hover:text-white">
              <SkipForward size={20} className="fill-current" />
            </button>
            <div
              className="hidden items-center gap-2 sm:flex"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <button onClick={toggleMute} className="btn-icon h-8 w-8 text-white/40 hover:text-white/70">
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-300',
                  showVolume ? 'w-16 opacity-100' : 'w-0 opacity-0',
                )}
              >
                <div
                  onClick={handleVolumeChange}
                  className="group relative h-1 w-full cursor-pointer rounded-full bg-white/10"
                >
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-primary-400"
                    style={{ width: `${volumePercent}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md"
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