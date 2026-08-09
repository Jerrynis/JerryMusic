import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import type { Playlist } from '@/types'
import { formatPlayCount, normalizeImageUrl } from '@/lib/utils'

interface PlaylistCardProps {
  playlist: Playlist
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  const navigate = useNavigate()
  const cover = normalizeImageUrl(playlist.coverImgUrl || playlist.picUrl)

  const handleClick = () => {
    navigate(`/playlist/${playlist.id}`)
  }

  return (
    <div onClick={handleClick} className="glass-card group cursor-pointer rounded-2xl p-3">
      {/* Cover */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
        {cover ? (
          <img
            src={cover}
            alt={playlist.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-700">
            <Play size={32} />
          </div>
        )}

        {/* Play count overlay */}
        {playlist.playCount !== undefined && playlist.playCount > 0 && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
            <Play size={10} className="fill-current" />
            {formatPlayCount(playlist.playCount)}
          </div>
        )}

        {/* Play button overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
            <Play size={20} className="ml-0.5 fill-current" />
          </div>
        </div>
      </div>

      {/* Name */}
      <p className="mt-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100">
        {playlist.name}
      </p>

      {/* Description (optional) */}
      {playlist.description && (
        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
          {playlist.description}
        </p>
      )}
    </div>
  )
}
