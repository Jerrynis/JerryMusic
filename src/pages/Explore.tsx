import { useEffect, useState } from 'react'
import { Play, TrendingUp, Sparkles, Music2 } from 'lucide-react'
import PlaylistCard from '@/components/PlaylistCard'
import { usePlayerStore } from '@/stores/playerStore'
import { toplist, personalized, newSongs } from '@/lib/api'
import { getArtistNames, getSongImage } from '@/lib/utils'
import type { Song, Playlist } from '@/types'

/* ---------- Inline SongCard for horizontal scroll ---------- */
function SongCard({ song }: { song: Song }) {
  const playSong = usePlayerStore((s) => s.playSong)
  const imageUrl = getSongImage(song)

  return (
    <div className="group w-40 flex-shrink-0 cursor-pointer" onClick={() => playSong(song)}>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={song.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <Play size={28} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg">
            <Play size={18} className="ml-0.5 fill-white" />
          </span>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-medium text-gray-900 dark:text-white">{song.name}</p>
      <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">{getArtistNames(song.artists)}</p>
    </div>
  )
}

/* ---------- Skeletons ---------- */
function GridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square w-full rounded-xl bg-black/5 dark:bg-white/5" />
          <div className="mt-2 h-3 w-3/4 rounded bg-black/5 dark:bg-white/5" />
        </div>
      ))}
    </div>
  )
}

function SongRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-40 flex-shrink-0 animate-pulse">
          <div className="aspect-square w-full rounded-xl bg-black/5 dark:bg-white/5" />
          <div className="mt-2 h-3 w-3/4 rounded bg-black/5 dark:bg-white/5" />
        </div>
      ))}
    </div>
  )
}

function SectionHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string
  subtitle?: string
  icon: typeof TrendingUp
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon size={20} className="text-primary-500" />
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl bg-black/5 text-sm text-gray-400 dark:bg-white/5">
      {text}
    </div>
  )
}

/* ---------- Page ---------- */
export default function Explore() {
  const [toplists, setToplists] = useState<Playlist[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [songs, setSongs] = useState<Song[]>([])

  const [loadingToplists, setLoadingToplists] = useState(true)
  const [loadingPlaylists, setLoadingPlaylists] = useState(true)
  const [loadingSongs, setLoadingSongs] = useState(true)

  // Toplists
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await toplist()
        if (!cancelled) setToplists(res.list || [])
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingToplists(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Personalized playlists
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await personalized(30)
        if (!cancelled) setPlaylists(res.result || [])
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingPlaylists(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // New songs
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await newSongs(0)
        if (!cancelled) setSongs(res.data || [])
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingSongs(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page-enter px-4 py-4 sm:px-6 lg:px-8">
      {/* 飙升榜单 */}
      <section className="mb-10">
        <SectionHeader icon={TrendingUp} title="飙升榜单" subtitle="各大音乐排行榜实时更新" />
        {loadingToplists ? (
          <GridSkeleton count={10} />
        ) : toplists.length === 0 ? (
          <EmptyState text="暂无榜单数据" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {toplists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )}
      </section>

      {/* 精选歌单 */}
      <section className="mb-10">
        <SectionHeader icon={Sparkles} title="精选歌单" subtitle="为你精选的优质歌单合集" />
        {loadingPlaylists ? (
          <GridSkeleton count={15} />
        ) : playlists.length === 0 ? (
          <EmptyState text="暂无歌单数据" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )}
      </section>

      {/* 新歌速递 */}
      <section className="mb-4">
        <SectionHeader icon={Music2} title="新歌速递" subtitle="发现最新上架的音乐" />
        {loadingSongs ? (
          <SongRowSkeleton />
        ) : songs.length === 0 ? (
          <EmptyState text="暂无新歌数据" />
        ) : (
          <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
            {songs.slice(0, 15).map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
