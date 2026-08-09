import { NavLink } from 'react-router-dom'
import { Home, Search, Compass, User, Settings, LogIn } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useUIStore } from '@/stores/uiStore'
import { cn, normalizeImageUrl } from '@/lib/utils'

interface NavItem {
  to: string
  icon: typeof Home
  label: string
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/search', icon: Search, label: '搜索' },
  { to: '/explore', icon: Compass, label: '发现' },
  { to: '/profile', icon: User, label: '我的' },
]

export default function Sidebar() {
  const isLogin = useUserStore((s) => s.isLogin)
  const playlists = useUserStore((s) => s.playlists)
  const profile = useUserStore((s) => s.profile)
  const setShowLogin = useUIStore((s) => s.setShowLogin)
  const setShowSettings = useUIStore((s) => s.setShowSettings)

  return (
    <aside className="glass hidden lg:flex h-full w-64 flex-shrink-0 flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5">
        <img
          src="https://img.jerry-nis.top/d8703c5c-4c4a-49cc-bd94-3363c9eda2d8.png"
          alt="JerryMusic"
          className="h-9 w-9 rounded-lg object-cover"
        />
        <span className="text-gradient text-lg font-bold">JerryMusic</span>
      </div>

      {/* Navigation links */}
      <nav className="px-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User playlists section */}
      {isLogin && playlists.length > 0 && (
        <div className="mt-6 flex-1 overflow-y-auto px-3 scrollbar-thin">
          <h3 className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            我的歌单
          </h3>
          {playlists.map((playlist) => (
            <NavLink
              key={playlist.id}
              to={`/playlist/${playlist.id}`}
              className={({ isActive }) =>
                cn(
                  'mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-black/5 dark:bg-white/5'
                    : 'text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5',
                )
              }
            >
              <img
                src={normalizeImageUrl(playlist.coverImgUrl || playlist.picUrl)}
                alt={playlist.name}
                loading="lazy"
                className="h-9 w-9 flex-shrink-0 rounded object-cover"
              />
              <span className="line-clamp-1 flex-1">{playlist.name}</span>
            </NavLink>
          ))}
        </div>
      )}

      {/* Spacer to push bottom section down when no playlists */}
      {(!isLogin || playlists.length === 0) && <div className="flex-1" />}

      {/* Bottom section */}
      <div className="border-t border-black/5 p-3 dark:border-white/10">
        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <Settings size={18} />
          设置
        </button>

        {/* Login button or user info */}
        {isLogin && profile ? (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                isActive
                  ? 'bg-black/5 dark:bg-white/5'
                  : 'hover:bg-black/5 dark:hover:bg-white/5',
              )
            }
          >
            <img
              src={normalizeImageUrl(profile.avatarUrl)}
              alt={profile.nickname}
              className="h-8 w-8 rounded-full object-cover"
            />
            <span className="line-clamp-1 text-sm font-medium text-gray-900 dark:text-white">
              {profile.nickname}
            </span>
          </NavLink>
        ) : (
          <button
            onClick={() => setShowLogin(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
          >
            <LogIn size={18} />
            登录
          </button>
        )}
      </div>
    </aside>
  )
}
