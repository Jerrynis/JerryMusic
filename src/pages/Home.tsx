import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import PlaylistCard from '@/components/PlaylistCard'
import { usePlayerStore } from '@/stores/playerStore'
import { useUserStore } from '@/stores/userStore'
import { banner, personalized, recommendSongs, newSongs, toplist } from '@/lib/api'
import { getArtistNames, getSongImage, normalizeImageUrl } from '@/lib/utils'
import type { Song, Playlist } from '@/types'

interface BannerItem {
  pic?: string
  imageUrl?: string
  typeTitle: string
  targetId?: number
}

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
function BannerSkeleton() {
  return <div className="h-44 w-full animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
}

function PlaylistGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square w-full rounded-xl bg-black/5 dark:bg-white/5" />
          <div className="mt-2 h-3 w-3/4 rounded bg-black/5 dark:bg-white/5" />
          <div className="mt-2 h-3 w-1/2 rounded bg-black/5 dark:bg-white/5" />
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
          <div className="mt-2 h-3 w-1/2 rounded bg-black/5 dark:bg-white/5" />
        </div>
      ))}
    </div>
  )
}

/* ---------- Section Header ---------- */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
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
export default function Home() {
  const isLogin = useUserStore((s) => s.isLogin)

  const [banners, setBanners] = useState<BannerItem[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [songsTitle, setSongsTitle] = useState('每日推荐')
  const [toplists, setToplists] = useState<Playlist[]>([])

  const [loadingBanners, setLoadingBanners] = useState(true)
  const [loadingPlaylists, setLoadingPlaylists] = useState(true)
  const [loadingSongs, setLoadingSongs] = useState(true)
  const [loadingToplists, setLoadingToplists] = useState(true)

  // Banner
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await banner()
        if (!cancelled) setBanners(res.banners || [])
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingBanners(false)
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
        const res = await personalized(10)
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

  // Daily recommend (logged in) or new songs (guest)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (isLogin) {
          setSongsTitle('每日推荐')
          const res = await recommendSongs()
          if (!cancelled) setSongs(res.data?.dailySongs || [])
        } else {
          setSongsTitle('新歌速递')
          const res = await newSongs(0)
          if (!cancelled) setSongs(res.data || [])
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingSongs(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isLogin])

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

  return (
    <div className="page-enter px-4 py-4 sm:px-6 lg:px-8">
      {/* Banner */}
      <section className="mb-8">
        {loadingBanners ? (
          <BannerSkeleton />
        ) : banners.length === 0 ? (
          <EmptyState text="暂无轮播图" />
        ) : (
          <div className="scrollbar-thin flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {banners.map((b, i) => (
              <div
                key={i}
                className="relative h-44 w-full flex-shrink-0 snap-center overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 sm:w-[85%] lg:w-[58%]"
              >
                <img src={normalizeImageUrl(b.pic || b.imageUrl)} alt={b.typeTitle} className="h-full w-full object-cover" loading="lazy" />
                {b.typeTitle && (
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm">
                    {b.typeTitle}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 推荐歌单 */}
      <section className="mb-8">
        <SectionHeader title="推荐歌单" subtitle="为你精选的优质歌单" />
        {loadingPlaylists ? (
          <PlaylistGridSkeleton count={10} />
        ) : playlists.length === 0 ? (
          <EmptyState text="暂无推荐歌单" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )}
      </section>

      {/* 每日推荐 / 新歌速递 */}
      <section className="mb-8">
        <SectionHeader
          title={songsTitle}
          subtitle={isLogin ? '根据你的口味每日更新' : '发现最新上架的音乐'}
        />
        {loadingSongs ? (
          <SongRowSkeleton />
        ) : songs.length === 0 ? (
          <EmptyState text="暂无歌曲" />
        ) : (
          <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
            {songs.slice(0, 12).map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        )}
      </section>

      {/* 热门榜单 */}
      <section className="mb-4">
        <SectionHeader title="热门榜单" subtitle="各大排行榜一览" />
        {loadingToplists ? (
          <PlaylistGridSkeleton count={6} />
        ) : toplists.length === 0 ? (
          <EmptyState text="暂无榜单" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {toplists.slice(0, 10).map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
