import { useRef, useEffect, useState } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Mic2,
  ListMusic,
  X,
  Loader2,
  ChevronUp,
} from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { useUIStore } from '@/stores/uiStore'
import { formatTime, getArtistNames, cn, normalizeImageUrl } from '@/lib/utils'
import type { PlayMode } from '@/types'

const playModeConfig: Record<
  PlayMode['type'],
  { icon: React.ReactNode; label: string; active: boolean }
> = {
  order: { icon: <Repeat size={18} />, label: '顺序播放', active: false },
  repeat: { icon: <Repeat size={18} />, label: '列表循环', active: true },
  single: { icon: <Repeat1 size={18} />, label: '单曲循环', active: true },
  shuffle: { icon: <Shuffle size={18} />, label: '随机播放', active: true },
}

/* Square cover component - no spinning */
function SquareCover({ cover, size = 'sm' }: { cover: string; size?: 'sm' | 'xs' | 'lg' }) {
  const dim = size === 'sm' ? 'h-14 w-14' : size === 'xs' ? 'h-11 w-11' : 'h-64 w-64'
  return (
    <div className={cn('relative flex-shrink-0 overflow-hidden rounded-lg shadow-md', dim)}>
      {cover ? (
        <img src={cover} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-700">
          <Play size={size === 'sm' ? 16 : size === 'xs' ? 12 : 32} className="text-gray-500" />
        </div>
      )}
    </div>
  )
}

export default function Player() {
  const setShowLyrics = useUIStore((s) => s.setShowLyrics)
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioUrlRef = useRef<string>('')

  // Store state
  const currentSong = usePlayerStore((s) => s.currentSong)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const playMode = usePlayerStore((s) => s.playMode)
  const playlist = usePlayerStore((s) => s.playlist)
  const audioUrl = usePlayerStore((s) => s.audioUrl)
  const isLoadingUrl = usePlayerStore((s) => s.isLoadingUrl)

  // Store actions
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const seek = usePlayerStore((s) => s.seek)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleMute = usePlayerStore((s) => s.toggleMute)
  const cyclePlayMode = usePlayerStore((s) => s.cyclePlayMode)
  const playSong = usePlayerStore((s) => s.playSong)

  // Local UI state
  const [showQueue, setShowQueue] = useState(false)

  // Audio sync: play/pause and src management
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isLoadingUrl || !audioUrl) {
      audio.pause()
      return
    }

    if (audioUrlRef.current !== audioUrl) {
      audioUrlRef.current = audioUrl
      audio.src = audioUrl
      audio.load()
    }

    if (isPlaying) {
      audio.play().catch(() => {
        usePlayerStore.getState().setIsPlaying(false)
      })
    } else {
      audio.pause()
    }
  }, [audioUrl, isPlaying, isLoadingUrl])

  // Audio sync: volume
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = muted ? 0 : volume
  }, [volume, muted])

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      usePlayerStore.getState().setCurrentTime(audio.currentTime)
    }
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        usePlayerStore.getState().setDuration(audio.duration)
      }
    }
    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        usePlayerStore.getState().setDuration(audio.duration)
      }
    }
    const handleEnded = () => {
      usePlayerStore.getState().next()
    }
    const handlePlay = () => {
      usePlayerStore.getState().setIsPlaying(true)
    }
    const handlePause = () => {
      if (!usePlayerStore.getState().isLoadingUrl) {
        usePlayerStore.getState().setIsPlaying(false)
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [])

  // Handlers
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const percent = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1))
    const time = percent * duration
    seek(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const percent = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1))
    setVolume(percent)
  }

  const toggleQueue = () => {
    setShowQueue((prev) => !prev)
  }

  const modeConfig = playModeConfig[playMode]
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const volumePercent = (muted ? 0 : volume) * 100
  const cover = normalizeImageUrl(currentSong?.album?.picUrl)

  return (
    <>
      {/* Audio element - always rendered at top level to persist across state changes. */}
      <audio ref={audioRef} />

      {/* Only render when a song is playing */}
      {currentSong && (
        <>
          {/* Queue panel */}
          {showQueue && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowQueue(false)}
              />
              <div className="glass-strong fixed bottom-24 right-6 z-50 flex h-80 w-72 flex-col overflow-hidden rounded-2xl shadow-glass-lg slide-up-enter lg:h-96 lg:w-80">
                <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
                  <h3 className="text-sm font-semibold">播放队列</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{playlist.length} 首</span>
                    <button
                      onClick={() => setShowQueue(false)}
                      className="btn-icon h-7 w-7 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  {playlist.length > 0 ? (
                    playlist.map((song, index) => {
                      const isCurrent = song.id === currentSong?.id
                      return (
                        <div
                          key={`${song.id}-${index}`}
                          onClick={() => playSong(song, playlist)}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors',
                            isCurrent
                              ? 'bg-primary-500/10'
                              : 'hover:bg-black/5 dark:hover:bg-white/5',
                          )}
                        >
                          <span
                            className={cn(
                              'w-5 flex-shrink-0 text-center text-xs',
                              isCurrent ? 'text-primary-500' : 'text-gray-400',
                            )}
                          >
                            {isCurrent && isPlaying ? '♪' : index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'line-clamp-1 text-sm',
                                isCurrent ? 'font-medium text-primary-500' : '',
                              )}
                            >
                              {song.name}
                            </p>
                            <p className="line-clamp-1 text-xs text-gray-400">
                              {getArtistNames(song.artists)}
                            </p>
                          </div>
                          <span className="flex-shrink-0 text-xs text-gray-400">
                            {formatTime(song.duration / 1000)}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      播放队列为空
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ==================== Mobile Mini Player ==================== */}
          <div className="fixed bottom-14 left-0 right-0 z-40 lg:hidden">
            {/* Progress bar at top */}
            <div
              onClick={handleSeek}
              className="relative h-0.5 w-full cursor-pointer bg-gray-300/40 dark:bg-gray-600/40"
            >
              <div
                className="absolute left-0 top-0 h-full bg-primary-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="glass-strong flex h-14 items-center gap-3 px-3">
              <button
                onClick={() => setShowLyrics(true)}
                className="flex-shrink-0"
                title="查看歌词"
              >
                <SquareCover cover={cover} size="xs" />
              </button>
              <button
                onClick={() => setShowLyrics(true)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="line-clamp-1 text-sm font-medium">
                  {currentSong.name}
                </p>
                <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                  {getArtistNames(currentSong.artists)}
                </p>
              </button>
              <button
                onClick={togglePlay}
                disabled={isLoadingUrl}
                className="btn-icon h-10 w-10 flex-shrink-0 text-gray-700 dark:text-gray-200 disabled:opacity-50"
              >
                {isLoadingUrl ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={24} className="fill-current" />
                ) : (
                  <Play size={24} className="ml-0.5 fill-current" />
                )}
              </button>
              <button
                onClick={next}
                className="btn-icon h-10 w-10 flex-shrink-0 text-gray-700 dark:text-gray-200"
              >
                <SkipForward size={22} className="fill-current" />
              </button>
            </div>
          </div>

          {/* ==================== Desktop Floating Player Bar ==================== */}
          <div className="fixed bottom-4 left-1/2 z-50 hidden w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 lg:block">
            <div className="glass-strong flex h-20 items-center justify-between gap-4 rounded-2xl px-4 shadow-glass-lg">
              {/* Left: Square cover + Song info */}
              <div className="flex w-[240px] items-center gap-3">
                <button
                  onClick={() => setShowLyrics(true)}
                  className="flex-shrink-0"
                  title="查看歌词"
                >
                  <SquareCover cover={cover} size="sm" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">
                    {currentSong.name}
                  </p>
                  <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                    {getArtistNames(currentSong.artists)}
                  </p>
                </div>
                <button
                  onClick={() => setShowLyrics(true)}
                  className="btn-icon h-7 w-7 flex-shrink-0 text-gray-400 hover:text-primary-500"
                  title="展开歌词"
                >
                  <ChevronUp size={18} />
                </button>
              </div>

              {/* Center: Controls + Progress */}
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
                {/* Control buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={cyclePlayMode}
                    title={modeConfig.label}
                    className={cn(
                      'btn-icon h-8 w-8',
                      modeConfig.active
                        ? 'text-primary-500'
                        : 'text-gray-500 hover:text-primary-500 dark:text-gray-400',
                    )}
                  >
                    {modeConfig.icon}
                  </button>

                  <button
                    onClick={prev}
                    className="btn-icon h-8 w-8 text-gray-600 hover:text-primary-500 dark:text-gray-300"
                  >
                    <SkipBack size={18} className="fill-current" />
                  </button>

                  <button
                    onClick={togglePlay}
                    disabled={isLoadingUrl}
                    className="btn-icon h-10 w-10 bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 shadow-md"
                  >
                    {isLoadingUrl ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : isPlaying ? (
                      <Pause size={20} className="fill-current" />
                    ) : (
                      <Play size={20} className="ml-0.5 fill-current" />
                    )}
                  </button>

                  <button
                    onClick={next}
                    className="btn-icon h-8 w-8 text-gray-600 hover:text-primary-500 dark:text-gray-300"
                  >
                    <SkipForward size={18} className="fill-current" />
                  </button>

                  <button
                    onClick={() => setShowLyrics(true)}
                    className="btn-icon h-8 w-8 text-gray-500 hover:text-primary-500 dark:text-gray-400"
                    title="歌词"
                  >
                    <Mic2 size={18} />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="flex w-full max-w-xl items-center gap-2">
                  <span className="w-10 flex-shrink-0 text-right text-xs tabular-nums text-gray-400">
                    {formatTime(currentTime)}
                  </span>
                  <div
                    onClick={handleSeek}
                    className="group relative h-1.5 flex-1 cursor-pointer rounded-full bg-gray-300/50 dark:bg-gray-600/50"
                  >
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-primary-500 transition-[width] duration-150"
                      style={{ width: `${progressPercent}%` }}
                    />
                    <div
                      className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                      style={{ left: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="w-10 flex-shrink-0 text-xs tabular-nums text-gray-400">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Right: Volume & toggles */}
              <div className="flex w-[200px] items-center justify-end gap-1">
                <button
                  onClick={toggleQueue}
                  title="播放队列"
                  className={cn(
                    'btn-icon h-8 w-8',
                    showQueue
                      ? 'text-primary-500'
                      : 'text-gray-500 hover:text-primary-500 dark:text-gray-400',
                  )}
                >
                  <ListMusic size={18} />
                </button>

                <button
                  onClick={toggleMute}
                  className="btn-icon h-8 w-8 text-gray-500 hover:text-primary-500 dark:text-gray-400"
                >
                  {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <div
                  onClick={handleVolumeChange}
                  className="group relative h-1.5 w-16 cursor-pointer rounded-full bg-gray-300/50 dark:bg-gray-600/50"
                >
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-primary-500"
                    style={{ width: `${volumePercent}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                    style={{ left: `${volumePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
