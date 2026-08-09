export interface Song {
  id: number
  name: string
  artists: Artist[]
  album: Album
  duration: number
  fee: number
  mvId?: number
  alia?: string[]
  privilege?: {
    maxbr: number
  }
}

export interface Artist {
  id: number
  name: string
  picUrl?: string
  alias?: string[]
  briefDesc?: string
  albumSize?: number
  musicSize?: number
}

export interface Album {
  id: number
  name: string
  picUrl?: string
  artist?: Artist
}

export interface Playlist {
  id: number
  name: string
  coverImgUrl?: string
  picUrl?: string
  description?: string
  trackCount?: number
  playCount?: number
  creator?: {
    userId: number
    nickname: string
    avatarUrl?: string
  }
  tracks?: Song[]
}

export interface SongUrl {
  id: number
  url: string
  br: number
  size: number
  type: string
  code: number
}

export interface Lyric {
  lrc?: { lyric: string }
  tlyric?: { lyric: string }
  romalrc?: { lyric: string }
}

export interface UserProfile {
  userId: number
  nickname: string
  avatarUrl: string
  backgroundUrl?: string
  signature?: string
  description?: string
  detailDescription?: string
  gender?: number
  city?: number
  birthday?: number
  vipType?: number
  followeds?: number
  follows?: number
  eventCount?: number
  playlistCount?: number
  playlistBeSubscribedCount?: number
  level?: number
  listenSongs?: number
  createDays?: number
}

export interface AccountInfo {
  id: number
  userName: string
  type: number
  status: number
  whitelistTelStatus: number
  createTime: number
  token?: string
  profile: UserProfile
}

export interface SearchResult {
  songs?: Song[]
  songCount?: number
  artists?: Artist[]
  artistCount?: number
  albums?: Album[]
  albumCount?: number
  playlists?: Playlist[]
  playlistCount?: number
}

export interface PlayMode {
  type: 'order' | 'repeat' | 'single' | 'shuffle'
}

export interface LyricLine {
  time: number
  text: string
  translation?: string
}
