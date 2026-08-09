import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Play, Heart, Share2, Download, Music } from 'lucide-react'
import SongTable from '@/components/SongTable'
import { usePlayerStore } from '@/stores/playerStore'
import { playlistDetail, playlistTrackAll } from '@/lib/api'
import { formatPlayCount, normalizeImageUrl } from '@/lib/utils'
import type { Song, Playlist } from '@/types'

function DetailSkeleton() {
  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="h-48 w-48 flex-shrink-0 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-1/2 animate-pulse rounded bg-black/5 dark:bg-white/5" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-black/5 dark:bg-white/5" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-black/5 dark:bg-white/5" />
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-4 rounded-lg p-2">
            <div className="h-10 w-10 rounded bg-black/5 dark:bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-black/5 dark:bg-white/5" />
              <div className="h-3 w-1/4 rounded bg-black/5 dark:bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>()
  const playPlaylist = usePlayerStore((s) => s.playPlaylist)

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [tracks, setTracks] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    const pid = Number(id)
    if (Number.isNaN(pid)) return

    let cancelled = false
    setLoading(true)
    setError(false)
    setTracks([])
    ;(async () => {
      try {
        const [detailRes, trackRes] = await Promise.all([
          playlistDetail(pid),
          playlistTrackAll(pid, 300, 0),
        ])
        if (cancelled) return
        setPlaylist(detailRes.playlist)
        setTracks(trackRes.songs || [])
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <DetailSkeleton />

  if (error || !playlist) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
        <Music size={48} className="opacity-40" />
        <p className="text-sm">歌单加载失败，请稍后再试</p>
      </div>
    )
  }

  const cover = normalizeImageUrl(playlist.coverImgUrl || playlist.picUrl)
  const creator = playlist.creator

  return (
    <div className="page-enter px-4 py-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="h-48 w-48 flex-shrink-0 overflow-hidden rounded-2xl bg-black/5 shadow-xl dark:bg-white/5">
          {cover ? (
            <img src={cover} alt={playlist.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <Music size={40} />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{playlist.name}</h1>

          {creator && (
            <div className="mt-3 flex items-center gap-2">
              {creator.avatarUrl && (
                <img
                  src={normalizeImageUrl(creator.avatarUrl)}
                  alt={creator.nickname}
                  className="h-8 w-8 rounded-full object-cover"
                  loading="lazy"
                />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-300">{creator.nickname}</span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {playlist.playCount !== undefined && playlist.playCount > 0 && (
              <span>播放 {formatPlayCount(playlist.playCount)} 次</span>
            )}
            <span>共 {playlist.trackCount || tracks.length} 首</span>
          </div>

          {playlist.description && (
            <p className="mt-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{playlist.description}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => tracks.length > 0 && playPlaylist(tracks, 0)}
              className="flex items-center gap-2 rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition shadow-sm hover:bg-primary-600"
            >
              <Play size={16} className="fill-white" />
              播放全部
            </button>
            <button className="flex items-center gap-2 rounded-full border border-black/5 px-4 py-2.5 text-sm text-gray-600 transition hover:border-gray-300 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/20">
              <Heart size={16} />
              收藏
            </button>
            <button className="flex items-center gap-2 rounded-full border border-black/5 px-4 py-2.5 text-sm text-gray-600 transition hover:border-gray-300 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/20">
              <Share2 size={16} />
              分享
            </button>
            <button className="flex items-center gap-2 rounded-full border border-black/5 px-4 py-2.5 text-sm text-gray-600 transition hover:border-gray-300 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/20">
              <Download size={16} />
              下载
            </button>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            歌曲列表 <span className="ml-1 text-sm font-normal text-gray-400">({tracks.length})</span>
          </h2>
        </div>
        {tracks.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl bg-black/5 text-sm text-gray-400 dark:bg-white/5">
            暂无歌曲
          </div>
        ) : (
          <SongTable songs={tracks} />
        )}
      </div>
    </div>
  )
}
