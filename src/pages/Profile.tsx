import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Music, Heart, UserPlus, Users, ListMusic, CalendarDays } from 'lucide-react'
import PlaylistCard from '@/components/PlaylistCard'
import { useUserStore } from '@/stores/userStore'
import { formatPlayCount, normalizeImageUrl } from '@/lib/utils'
import type { Playlist } from '@/types'

function ProfileSkeleton() {
  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-6">
        <div className="h-24 w-24 animate-pulse rounded-full bg-black/5 dark:bg-white/5" />
        <div className="space-y-3">
          <div className="h-7 w-40 animate-pulse rounded bg-black/5 dark:bg-white/5" />
          <div className="h-4 w-56 animate-pulse rounded bg-black/5 dark:bg-white/5" />
          <div className="h-4 w-48 animate-pulse rounded bg-black/5 dark:bg-white/5" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square w-full rounded-xl bg-black/5 dark:bg-white/5" />
            <div className="mt-2 h-3 w-3/4 rounded bg-black/5 dark:bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={16} className="text-gray-400" />
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const profile = useUserStore((s) => s.profile)
  const isLogin = useUserStore((s) => s.isLogin)
  const playlists = useUserStore((s) => s.playlists)
  const checkLogin = useUserStore((s) => s.checkLogin)
  const logout = useUserStore((s) => s.logout)

  const [initChecked, setInitChecked] = useState(false)

  useEffect(() => {
    let done = false
    checkLogin().finally(() => {
      if (!done) setInitChecked(true)
    })
    return () => {
      done = true
    }
  }, [checkLogin])

  // Split playlists into created & subscribed
  const created: Playlist[] = []
  const subscribed: Playlist[] = []
  playlists.forEach((p) => {
    if (profile && p.creator?.userId === profile.userId) {
      created.push(p)
    } else {
      subscribed.push(p)
    }
  })

  const handleLogout = async () => {
    await logout()
  }

  if (!initChecked) return <ProfileSkeleton />

  if (!isLogin || !profile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-500 dark:bg-primary-500/10">
          <Music size={36} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">登录后查看你的音乐世界</h2>
        <p className="max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">
          登录账号后可以同步你的歌单、收藏和播放记录，享受个性化推荐
        </p>
        <button
          onClick={() => navigate('/login')}
          className="rounded-full bg-primary-500 px-8 py-3 text-sm font-medium text-white transition shadow-sm hover:bg-primary-600"
        >
          立即登录
        </button>
      </div>
    )
  }

  return (
    <div className="page-enter px-4 py-4 sm:px-6 lg:px-8">
      {/* Profile header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <img
          src={normalizeImageUrl(profile.avatarUrl)}
          alt={profile.nickname}
          className="h-24 w-24 rounded-full object-cover ring-4 ring-primary-500/20"
        />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.nickname}</h1>
            {profile.vipType && profile.vipType > 0 && (
              <span className="rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-xs font-medium text-white">
                VIP
              </span>
            )}
          </div>
          {profile.signature ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{profile.signature}</p>
          ) : (
            <p className="mt-1 text-sm text-gray-400">这个人很懒，什么都没留下</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-5">
            {profile.follows !== undefined && (
              <StatItem icon={UserPlus} label="关注" value={formatPlayCount(profile.follows)} />
            )}
            {profile.followeds !== undefined && (
              <StatItem icon={Users} label="粉丝" value={formatPlayCount(profile.followeds)} />
            )}
            {profile.playlistCount !== undefined && (
              <StatItem icon={ListMusic} label="歌单" value={profile.playlistCount} />
            )}
            {profile.createDays !== undefined && (
              <StatItem icon={CalendarDays} label="注册天数" value={profile.createDays} />
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-full border border-black/5 px-4 py-2 text-sm text-gray-600 transition hover:border-red-300 hover:text-red-500 dark:border-white/10 dark:text-gray-300 dark:hover:border-red-500/30 dark:hover:text-red-400"
        >
          <LogOut size={16} />
          退出登录
        </button>
      </div>

      {/* Created playlists */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          我创建的歌单 <span className="ml-1 text-sm font-normal text-gray-400">({created.length})</span>
        </h2>
        {created.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl bg-black/5 text-sm text-gray-400 dark:bg-white/5">
            还没有创建歌单
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {created.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )}
      </section>

      {/* Subscribed playlists */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          我收藏的歌单 <span className="ml-1 text-sm font-normal text-gray-400">({subscribed.length})</span>
        </h2>
        {subscribed.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl bg-black/5 text-sm text-gray-400 dark:bg-white/5">
            还没有收藏歌单
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {subscribed.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
