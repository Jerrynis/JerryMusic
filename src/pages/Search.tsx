import { useEffect, useState } from 'react'
import { Search as SearchIcon, X, Flame, Music2, User, Disc3, ListMusic } from 'lucide-react'
import SongTable from '@/components/SongTable'
import PlaylistCard from '@/components/PlaylistCard'
import { search, hotSearch, defaultSearch } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Song, Artist, Album, Playlist } from '@/types'

type SearchType = 1 | 100 | 10 | 1000

interface TypeOption {
  label: string
  value: SearchType
  icon: typeof Music2
}

const TYPE_OPTIONS: TypeOption[] = [
  { label: '单曲', value: 1, icon: Music2 },
  { label: '歌手', value: 100, icon: User },
  { label: '专辑', value: 10, icon: Disc3 },
  { label: '歌单', value: 1000, icon: ListMusic },
]

/* ---------- Skeletons ---------- */
function SongTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 rounded-lg p-2">
          <div className="h-10 w-10 flex-shrink-0 rounded bg-black/5 dark:bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-black/5 dark:bg-white/5" />
            <div className="h-3 w-1/4 rounded bg-black/5 dark:bg-white/5" />
          </div>
          <div className="h-3 w-20 rounded bg-black/5 dark:bg-white/5" />
        </div>
      ))}
    </div>
  )
}

function GridSkeleton({ count = 12 }: { count?: number }) {
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

export default function Search() {
  const [input, setInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<SearchType>(1)

  const [hots, setHots] = useState<{ first: string }[]>([])
  const [defaultKeyword, setDefaultKeyword] = useState('')

  const [songs, setSongs] = useState<Song[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [total, setTotal] = useState(0)

  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Load hot search + default keyword on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [hotRes, defRes] = await Promise.allSettled([hotSearch(), defaultSearch()])
      if (cancelled) return
      if (hotRes.status === 'fulfilled') setHots(hotRes.value.result?.hots || [])
      if (defRes.status === 'fulfilled') setDefaultKeyword(defRes.value.data?.realkeyword || '')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Debounce input -> keyword (300ms)
  useEffect(() => {
    if (!input.trim()) {
      setKeyword('')
      return
    }
    const timer = setTimeout(() => {
      setKeyword(input.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [input])

  // Run search when keyword or type changes
  useEffect(() => {
    if (!keyword.trim()) {
      setHasSearched(false)
      setSongs([])
      setArtists([])
      setAlbums([])
      setPlaylists([])
      setTotal(0)
      return
    }
    let cancelled = false
    setSearching(true)
    setHasSearched(true)
    ;(async () => {
      try {
        const res = await search(keyword, type, 30, 0)
        if (cancelled) return
        const data = res.result || {}
        setSongs(data.songs || [])
        setArtists(data.artists || [])
        setAlbums(data.albums || [])
        setPlaylists(data.playlists || [])
        if (type === 1) setTotal(data.songCount || 0)
        else if (type === 100) setTotal(data.artistCount || 0)
        else if (type === 10) setTotal(data.albumCount || 0)
        else setTotal(data.playlistCount || 0)
      } catch {
        if (!cancelled) {
          setSongs([])
          setArtists([])
          setAlbums([])
          setPlaylists([])
          setTotal(0)
        }
      } finally {
        if (!cancelled) setSearching(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [keyword, type])

  const handleSearch = () => {
    if (!input.trim()) return
    setKeyword(input.trim())
  }

  const handleHotClick = (kw: string) => {
    setInput(kw)
    setKeyword(kw)
  }

  const renderResults = () => {
    if (searching) {
      return type === 1 ? <SongTableSkeleton /> : <GridSkeleton />
    }
    if (total === 0) {
      return (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-400">
          <SearchIcon size={40} className="opacity-40" />
          <p className="text-sm">没有找到相关结果</p>
        </div>
      )
    }
    switch (type) {
      case 1:
        return <SongTable songs={songs} />
      case 100:
        return (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {artists.map((a) => (
              <div key={a.id} className="group cursor-pointer text-center">
                <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
                  {a.picUrl ? (
                    <img
                      src={a.picUrl}
                      alt={a.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-medium text-gray-900 dark:text-white">{a.name}</p>
              </div>
            ))}
          </div>
        )
      case 10:
        return (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {albums.map((a) => (
              <div key={a.id} className="group cursor-pointer">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                  {a.picUrl ? (
                    <img
                      src={a.picUrl}
                      alt={a.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <Disc3 size={32} />
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-medium text-gray-900 dark:text-white">{a.name}</p>
                {a.artist && (
                  <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">{a.artist.name}</p>
                )}
              </div>
            ))}
          </div>
        )
      case 1000:
        return (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )
      default:
        return null
    }
  }

  const placeholder = defaultKeyword || '搜索音乐、歌手、专辑、歌单'

  return (
    <div className="page-enter px-4 py-4 sm:px-6 lg:px-8">
      {/* Search bar */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={placeholder}
            className="w-full rounded-full glass border border-black/5 dark:border-white/10 py-3 pl-11 pr-10 text-sm text-gray-900 outline-none transition focus:border-primary-500 dark:text-white"
          />
          {input && (
            <button
              onClick={() => {
                setInput('')
                setKeyword('')
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          className="hidden rounded-full bg-primary-500 px-6 py-3 text-sm font-medium text-white transition shadow-sm hover:bg-primary-600 sm:block"
        >
          搜索
        </button>
      </div>

      {!hasSearched ? (
        /* Hot search tags */
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Flame size={18} className="text-primary-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">热门搜索</h2>
          </div>
          {hots.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">暂无热搜</div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {hots.map((h, i) => (
                <button
                  key={i}
                  onClick={() => handleHotClick(h.first)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm transition hover:border-primary-500 hover:text-primary-500 dark:text-gray-300 dark:hover:border-primary-500',
                    i < 3
                      ? 'border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-400'
                      : 'border-black/5 text-gray-600 dark:border-white/10',
                  )}
                >
                  {h.first}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Results */
        <div>
          {/* Type selector */}
          <div className="mb-4 flex items-center gap-2 border-b border-black/5 dark:border-white/10">
            {TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition',
                    type === opt.value
                      ? 'border-primary-500 text-primary-500'
                      : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
                  )}
                >
                  <Icon size={15} />
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Result count */}
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {searching ? '搜索中...' : `共找到 ${total} 个结果`}
          </p>

          {renderResults()}
        </div>
      )}
    </div>
  )
}
