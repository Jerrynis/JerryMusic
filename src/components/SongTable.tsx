import { useNavigate } from 'react-router-dom'
import { Play, Pause } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { formatTime, getArtistNames, cn } from '@/lib/utils'
import type { Song } from '@/types'

interface SongTableProps {
  songs: Song[]
  onPlayAll?: () => void
  showHeader?: boolean
}

/** Animated equalizer bars shown next to the currently playing song */
function Equalizer() {
  return (
    <div className="flex h-4 items-end gap-[2px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-primary-500"
          style={{
            height: '100%',
            transformOrigin: 'bottom',
            animation: `eq-bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes eq-bounce {
          0% { transform: scaleY(0.25); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}

export default function SongTable({ songs, onPlayAll, showHeader = true }: SongTableProps) {
  const currentSong = usePlayerStore((s) => s.currentSong)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const playSong = usePlayerStore((s) => s.playSong)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const navigate = useNavigate()

  const handleRowClick = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay()
    } else {
      playSong(song, songs)
    }
  }

  if (songs.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-400">
        暂无歌曲
      </div>
    )
  }

  const gridCols = 'grid-cols-[36px_1fr_44px] sm:grid-cols-[40px_1fr_minmax(120px,200px)_minmax(120px,1fr)_60px]'

  return (
    <div className="w-full">
      {/* Play all button */}
      {onPlayAll && (
        <div className="mb-3 px-4">
          <button
            onClick={onPlayAll}
            className="flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
          >
            <Play size={16} className="fill-current" />
            播放全部
          </button>
        </div>
      )}

      {/* Header */}
      {showHeader && (
        <div
          className={cn(
            'grid items-center gap-4 border-b border-black/5 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:border-white/10',
            gridCols,
          )}
        >
          <span className="text-center">#</span>
          <span>标题</span>
          <span className="hidden sm:block">歌手</span>
          <span className="hidden sm:block">专辑</span>
          <span className="text-right">时长</span>
        </div>
      )}

      {/* Song rows */}
      {songs.map((song, index) => {
        const isCurrent = currentSong?.id === song.id
        const isCurrentPlaying = isCurrent && isPlaying

        return (
          <div
            key={`${song.id}-${index}`}
            onClick={() => handleRowClick(song)}
            className={cn(
              'group grid cursor-pointer items-center gap-4 rounded-lg px-4 py-2.5 text-sm transition-colors',
              gridCols,
              isCurrent
                ? 'bg-primary-50 dark:bg-primary-500/10'
                : 'hover:bg-black/5 dark:hover:bg-white/5',
            )}
          >
            {/* Index / Play icon / Equalizer */}
            <div className="flex h-5 items-center justify-center">
              {isCurrentPlaying ? (
                <Equalizer />
              ) : (
                <>
                  {/* Index number - hidden on hover */}
                  <span
                    className={cn(
                      'text-center group-hover:hidden',
                      isCurrent ? 'text-primary-500' : 'text-gray-400',
                    )}
                  >
                    {index + 1}
                  </span>
                  {/* Play/pause icon - shown on hover */}
                  {isCurrent ? (
                    <Pause
                      size={14}
                      className="hidden fill-current text-primary-500 group-hover:block"
                    />
                  ) : (
                    <Play
                      size={14}
                      className="hidden fill-current text-gray-600 group-hover:block dark:text-gray-300"
                    />
                  )}
                </>
              )}
            </div>

            {/* Title with alias */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'line-clamp-1 font-medium',
                    isCurrent ? 'text-primary-500' : 'text-gray-900 dark:text-white',
                  )}
                >
                  {song.name}
                </span>
                {song.alia && song.alia.length > 0 && (
                  <span className="line-clamp-1 flex-shrink-0 text-xs text-gray-400">
                    ({song.alia[0]})
                  </span>
                )}
              </div>
            </div>

            {/* Artist (clickable) */}
            <div
              className="hidden min-w-0 sm:block"
              onClick={(e) => {
                e.stopPropagation()
                const artist = song.artists?.[0]
                if (artist?.id) {
                  navigate(`/artist/${artist.id}`)
                }
              }}
            >
              <span className="line-clamp-1 cursor-pointer text-gray-500 transition-colors hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400">
                {getArtistNames(song.artists)}
              </span>
            </div>

            {/* Album (clickable) */}
            <div
              className="hidden min-w-0 sm:block"
              onClick={(e) => {
                e.stopPropagation()
                if (song.album?.id) {
                  navigate(`/album/${song.album.id}`)
                }
              }}
            >
              <span className="line-clamp-1 cursor-pointer text-gray-500 transition-colors hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400">
                {song.album?.name || ''}
              </span>
            </div>

            {/* Duration */}
            <span className="text-right text-gray-400">
              {formatTime(song.duration / 1000)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
