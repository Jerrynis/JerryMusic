import { create } from 'zustand'
import type { UserProfile, Playlist } from '@/types'
import {
  loginStatus,
  loginQrKey,
  loginQrCreate,
  loginQrCheck,
  loginCellphone,
  logout as apiLogout,
  userPlaylist,
  setCookie,
  clearCookie,
} from '@/lib/api'

interface UserState {
  profile: UserProfile | null
  isLogin: boolean
  playlists: Playlist[]
  loading: boolean

  checkLogin: () => Promise<void>
  qrLogin: () => Promise<{ key: string; qrimg: string } | null>
  checkQrStatus: (key: string) => Promise<{ status: 'waiting' | 'scanned' | 'success' | 'expired' }>
  phoneLogin: (phone: string, password: string, code?: number) => Promise<boolean>
  logout: () => Promise<void>
  fetchPlaylists: (uid: number) => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLogin: false,
  playlists: [],
  loading: false,

  checkLogin: async () => {
    try {
      const res = await loginStatus()
      if (res.data?.profile) {
        set({ profile: res.data.profile, isLogin: true })
        get().fetchPlaylists(res.data.profile.userId)
      } else {
        set({ profile: null, isLogin: false })
      }
    } catch {
      set({ profile: null, isLogin: false })
    }
  },

  qrLogin: async () => {
    try {
      const keyRes = await loginQrKey()
      const key = keyRes.data.unikey
      const qrRes = await loginQrCreate(key)
      return { key, qrimg: qrRes.data.qrimg }
    } catch {
      return null
    }
  },

  checkQrStatus: async (key) => {
    try {
      const res = await loginQrCheck(key)
      if (res.code === 800) return { status: 'expired' as const }
      if (res.code === 802) return { status: 'scanned' as const }
      if (res.code === 803) {
        if (res.cookie) {
          setCookie(res.cookie)
        }
        await get().checkLogin()
        return { status: 'success' as const }
      }
      return { status: 'waiting' as const }
    } catch {
      return { status: 'waiting' as const }
    }
  },

  phoneLogin: async (phone, password, code = 86) => {
    try {
      const res = await loginCellphone(phone, password, code)
      if (res.code === 200 && res.cookie) {
        setCookie(res.cookie)
        await get().checkLogin()
        return true
      }
      return false
    } catch {
      return false
    }
  },

  logout: async () => {
    try {
      await apiLogout()
    } catch {
      // ignore
    }
    clearCookie()
    set({ profile: null, isLogin: false, playlists: [] })
  },

  fetchPlaylists: async (uid) => {
    try {
      const res = await userPlaylist(uid)
      set({ playlists: res.playlist || [] })
    } catch {
      set({ playlists: [] })
    }
  },
}))
