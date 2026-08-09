import type {
  Song,
  SongUrl,
  Lyric,
  Playlist,
  UserProfile,
  AccountInfo,
  SearchResult,
  Artist,
} from '@/types'
import { normalizeImageUrl } from '@/lib/utils'

const BASE = '/api'

function getCookie(): string {
  return localStorage.getItem('music_cookie') || ''
}

export function setCookie(cookie: string) {
  localStorage.setItem('music_cookie', cookie)
}

export function clearCookie() {
  localStorage.removeItem('music_cookie')
}

async function request<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })
  }
  const cookie = getCookie()
  if (cookie) {
    url.searchParams.set('cookie', cookie)
  }
  url.searchParams.set('timestamp', String(Date.now()))

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}

// ===== Search =====
interface RawSong {
  id: number
  name: string
  ar?: { id: number; name: string }[]
  artists?: { id: number; name: string }[]
  al?: { id: number; name: string; picUrl?: string }
  album?: { id: number; name: string; picUrl?: string }
  dt?: number
  duration?: number
  fee?: number
  mv?: number
  mvId?: number
  alia?: string[]
}

function transformSong(raw: RawSong): Song {
  return {
    id: raw.id,
    name: raw.name,
    artists: (raw.ar || raw.artists || []).map((a) => ({ id: a.id, name: a.name })),
    album: {
      id: (raw.al || raw.album)?.id || 0,
      name: (raw.al || raw.album)?.name || '',
      picUrl: normalizeImageUrl((raw.al || raw.album)?.picUrl),
    },
    duration: raw.dt || raw.duration || 0,
    fee: raw.fee || 0,
    mvId: raw.mv || raw.mvId,
    alia: raw.alia,
  }
}

export async function search(keywords: string, type = 1, limit = 30, offset = 0): Promise<{ result: SearchResult; code: number }> {
  const res = await request<{ result: any; code: number }>('/cloudsearch', { keywords, type, limit, offset })
  if (res.result?.songs) {
    res.result.songs = res.result.songs.map(transformSong)
  }
  return res
}

export const searchSuggest = (keywords: string) =>
  request<{ result: { allMatch?: { keyword: string }[] } }>('/search/suggest', { keywords })

export const hotSearch = () =>
  request<{ result: { hots: { first: string }[] } }>('/search/hot')

export const defaultSearch = () =>
  request<{ data: { realkeyword: string } }>('/search/default')

// ===== Login =====
export const loginQrKey = () =>
  request<{ data: { unikey: string } }>('/login/qr/key')

export const loginQrCreate = (key: string) =>
  request<{ data: { qrimg: string; qrurl: string } }>('/login/qr/create', { key, qrimg: true })

export const loginQrCheck = (key: string) =>
  request<{ code: number; message: string; cookie?: string }>('/login/qr/check', { key })

export const loginCellphone = (phone: string, password: string, countrycode = 86) =>
  request<{ code: number; cookie?: string; profile?: UserProfile }>('/login/cellphone', {
    phone,
    password,
    countrycode,
  })

export const loginEmail = (email: string, password: string) =>
  request<{ code: number; cookie?: string; profile?: UserProfile }>('/login', {
    email,
    password,
  })

export const logout = () => request<{ code: number }>('/logout')

// ===== User =====
export const loginStatus = () =>
  request<{ data: { code: number; profile: UserProfile; account?: AccountInfo } }>('/login/status')

export const userDetail = (uid: number) =>
  request<{ code: number; profile: UserProfile; level: number }>('/user/detail', { uid })

export const userAccount = () =>
  request<{ code: number; account: AccountInfo; profile: UserProfile }>('/user/account')

export const userPlaylist = (uid: number, limit = 30, offset = 0) =>
  request<{ playlist: Playlist[] }>('/user/playlist', { uid, limit, offset })

export const userLevel = () =>
  request<{ data: { level: number; progress: number } }>('/user/level')

// ===== Playlist =====
export const playlistDetail = (id: number) =>
  request<{ code: number; playlist: Playlist }>('/playlist/detail', { id })

export async function playlistTrackAll(id: number, limit = 100, offset = 0): Promise<{ code: number; songs: Song[] }> {
  const res = await request<{ code: number; songs: any[] }>('/playlist/track/all', { id, limit, offset })
  return { code: res.code, songs: (res.songs || []).map(transformSong) }
}

export const personalized = (limit = 30) =>
  request<{ result: Playlist[] }>('/personalized', { limit })

export const topPlaylist = (limit = 30, order = 'hot') =>
  request<{ playlists: Playlist[] }>('/top/playlist', { limit, order })

// ===== Song =====
// unblock parameter: when 'true', attempts to unblock VIP/paid/unavailable songs
export const songUrl = (id: number, level = 'exhigh', unblock = false) =>
  request<{ data: SongUrl[] }>('/song/url/v1', { id, level, ...(unblock && { unblock: 'true' }) })

export async function songDetail(ids: number): Promise<{ songs: Song[] }> {
  const res = await request<{ songs: any[] }>('/song/detail', { ids })
  return { songs: (res.songs || []).map(transformSong) }
}

export const lyric = (id: number) => request<Lyric>('/lyric', { id })

// ===== Recommend =====
export async function recommendSongs(): Promise<{ data: { dailySongs: Song[] } }> {
  const res = await request<{ data: { dailySongs: any[] } }>('/recommend/songs')
  return { data: { dailySongs: (res.data?.dailySongs || []).map(transformSong) } }
}

export const recommendResource = () =>
  request<{ recommend: Playlist[] }>('/recommend/resource')

// ===== Discover =====
export const banner = () =>
  request<{ banners: { imageUrl: string; typeTitle: string; targetId?: number }[] }>('/banner', { type: 2 })

export async function newSongs(areaId = 0): Promise<{ data: Song[] }> {
  const res = await request<{ data: any[] }>('/top/song', { type: areaId })
  return { data: (res.data || []).map(transformSong) }
}

export const toplist = () =>
  request<{ list: Playlist[] }>('/toplist')

// ===== Artist =====
export const artistDetail = (id: number) =>
  request<{ data: { artist: Artist } }>('/artist/detail', { id })

export async function artistSongs(id: number, limit = 50, offset = 0, order = 'hot'): Promise<{ songs: Song[]; total: number }> {
  const res = await request<{ songs: any[]; total: number }>('/artist/songs', { id, limit, offset, order })
  return { songs: (res.songs || []).map(transformSong), total: res.total || 0 }
}
