import { create } from 'zustand'
import type { Song, LyricLine } from '@/types'
import { songUrl, lyric } from '@/lib/api'

type PlayMode = 'order' | 'repeat' | 'single' | 'shuffle'

const STORAGE_KEY = 'jerrymusic_player_state'

interface PersistedState {
  playlist: Song[]
  currentIndex: number
  currentSong: Song | null
  currentTime: number
  volume: number
  muted: boolean
  playMode: PlayMode
}

function saveToStorage(state: PlayerState) {
  try {
    const data: PersistedState = {
      playlist: state.playlist,
      currentIndex: state.currentIndex,
      currentSong: state.currentSong,
      currentTime: state.currentTime,
      volume: state.volume,
      muted: state.muted,
      playMode: state.playMode,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable, silently ignore
  }
}

function loadFromStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

let lastProgressSave = 0

interface PlayerState {
  // Queue
  playlist: Song[]
  currentIndex: number
  currentSong: Song | null

  // Playback
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  playMode: PlayMode

  // Audio URL
  audioUrl: string
  isLoadingUrl: boolean

  // Lyrics
  lyrics: LyricLine[]
  currentLyricIndex: number

  // Audio element reference (for seeking from any component)
  audioEl: HTMLAudioElement | null
  setAudioEl: (el: HTMLAudioElement | null) => void

  // Actions
  playSong: (song: Song, list?: Song[]) => void
  playPlaylist: (songs: Song[], index?: number) => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  seek: (time: number) => void
  setVolume: (vol: number) => void
  toggleMute: () => void
  cyclePlayMode: () => void
  setCurrentTime: (time: number) => void
  setDuration: (d: number) => void
  setIsPlaying: (playing: boolean) => void
  addToPlaylist: (songs: Song[]) => void
  removeFromPlaylist: (index: number) => void
  restoreState: () => void
  saveProgress: () => void
}

function parseLyrics(lrc: string, tlyric?: string): LyricLine[] {
  const lines: LyricLine[] = []
  const rawLines = lrc.split('\n')
  const translations = new Map<number, string>()

  if (tlyric) {
    tlyric.split('\n').forEach((line) => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/)
      if (match) {
        const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / Math.pow(10, match[3].length)
        translations.set(time, match[4].trim())
      }
    })
  }

  rawLines.forEach((line) => {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/)
    if (match) {
      const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / Math.pow(10, match[3].length)
      const text = match[4].trim()
      if (text) {
        let translation: string | undefined
        for (const [tTime, tText] of translations) {
          if (Math.abs(tTime - time) < 0.5) {
            translation = tText
            break
          }
        }
        lines.push({ time, text, translation })
      }
    }
  })

  return lines.sort((a, b) => a.time - b.time)
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  playlist: [],
  currentIndex: -1,
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  muted: false,
  playMode: 'order',
  audioUrl: '',
  isLoadingUrl: false,
  lyrics: [],
  currentLyricIndex: -1,
  audioEl: null,
  setAudioEl: (el) => set({ audioEl: el }),

  playSong: async (song, list) => {
    const playlist = list || [song]
    const index = playlist.findIndex((s) => s.id === song.id)
    set({
      playlist,
      currentIndex: index >= 0 ? index : 0,
      currentSong: song,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      lyrics: [],
      currentLyricIndex: -1,
      isLoadingUrl: true,
      audioUrl: '', // Clear old URL so audio element reloads
    })

    // Fetch audio URL - always try with unblock for VIP/paid songs (fee === 1)
    try {
      const isVip = song.fee === 1
      let res = await songUrl(song.id, 'exhigh', isVip)
      let url = res.data?.[0]?.url
      // If no URL and not already tried with unblock, retry with unblock
      if (!url && !isVip) {
        res = await songUrl(song.id, 'exhigh', true)
        url = res.data?.[0]?.url
      }
      if (url) {
        set({ audioUrl: url.replace(/^http:/, 'https:'), isLoadingUrl: false })
      } else {
        set({ isLoadingUrl: false, isPlaying: false })
      }
    } catch {
      set({ isLoadingUrl: false, isPlaying: false })
    }

    // Fetch lyrics
    try {
      const lrcRes = await lyric(song.id)
      const parsed = parseLyrics(lrcRes.lrc?.lyric || '', lrcRes.tlyric?.lyric)
      set({ lyrics: parsed })
    } catch {
      set({ lyrics: [] })
    }

    saveToStorage(get())
  },

  playPlaylist: (songs, index = 0) => {
    if (songs.length === 0) return
    const song = songs[index]
    get().playSong(song, songs)
  },

  togglePlay: () => {
    if (get().currentSong) {
      set((state) => ({ isPlaying: !state.isPlaying }))
    }
  },

  next: () => {
    const { playlist, currentIndex, playMode } = get()
    if (playlist.length === 0) return
    let nextIndex: number
    if (playMode === 'shuffle') {
      nextIndex = Math.floor(Math.random() * playlist.length)
    } else if (playMode === 'single') {
      nextIndex = currentIndex
    } else {
      nextIndex = (currentIndex + 1) % playlist.length
    }
    get().playSong(playlist[nextIndex], playlist)
  },

  prev: () => {
    const { playlist, currentIndex } = get()
    if (playlist.length === 0) return
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length
    get().playSong(playlist[prevIndex], playlist)
  },

  seek: (time) => {
    const { audioEl } = get()
    set({ currentTime: time })
    if (audioEl && !isNaN(audioEl.duration)) {
      audioEl.currentTime = time
    }
    saveToStorage(get())
  },

  setVolume: (vol) => {
    set({ volume: vol, muted: vol === 0 })
    saveToStorage(get())
  },

  toggleMute: () => {
    set((state) => ({ muted: !state.muted }))
    saveToStorage(get())
  },

  cyclePlayMode: () => {
    const modes: PlayMode[] = ['order', 'repeat', 'single', 'shuffle']
    const current = get().playMode
    const next = modes[(modes.indexOf(current) + 1) % modes.length]
    set({ playMode: next })
    saveToStorage(get())
  },

  setCurrentTime: (time) => {
    const { lyrics } = get()
    let lyricIndex = -1
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (time >= lyrics[i].time) {
        lyricIndex = i
        break
      }
    }
    set({ currentTime: time, currentLyricIndex: lyricIndex })
    // Throttle progress save to every 5s
    const now = Date.now()
    if (now - lastProgressSave > 5000) {
      lastProgressSave = now
      saveToStorage(get())
    }
  },

  setDuration: (d) => set({ duration: d }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  addToPlaylist: (songs) => {
    const existing = get().playlist
    const newSongs = songs.filter((s) => !existing.some((e) => e.id === s.id))
    set({ playlist: [...existing, ...newSongs] })
    saveToStorage(get())
  },

  removeFromPlaylist: (index) => {
    const { playlist, currentIndex } = get()
    const newPlaylist = playlist.filter((_, i) => i !== index)
    const newIndex = index < currentIndex ? currentIndex - 1 : currentIndex >= newPlaylist.length ? 0 : currentIndex
    set({
      playlist: newPlaylist,
      currentIndex: newIndex,
      currentSong: newPlaylist[newIndex] || null,
    })
    saveToStorage(get())
  },

  saveProgress: () => saveToStorage(get()),

  restoreState: async () => {
    const saved = loadFromStorage()
    if (!saved || !saved.currentSong || saved.playlist.length === 0) return
    set({
      playlist: saved.playlist,
      currentIndex: saved.currentIndex,
      currentSong: saved.currentSong,
      currentTime: saved.currentTime,
      volume: saved.volume,
      muted: saved.muted,
      playMode: saved.playMode,
      isPlaying: false,
      audioUrl: '',
      isLoadingUrl: true,
      lyrics: [],
      currentLyricIndex: -1,
    })

    const song = saved.currentSong

    // Fetch audio URL so playback works when user hits play
    try {
      const isVip = song.fee === 1
      let res = await songUrl(song.id, 'exhigh', isVip)
      let url = res.data?.[0]?.url
      if (!url && !isVip) {
        res = await songUrl(song.id, 'exhigh', true)
        url = res.data?.[0]?.url
      }
      if (url) {
        set({ audioUrl: url.replace(/^http:/, 'https:'), isLoadingUrl: false })
      } else {
        set({ isLoadingUrl: false })
      }
    } catch {
      set({ isLoadingUrl: false })
    }

    // Fetch lyrics
    try {
      const lrcRes = await lyric(song.id)
      const parsed = parseLyrics(lrcRes.lrc?.lyric || '', lrcRes.tlyric?.lyric)
      set({ lyrics: parsed })
    } catch {
      set({ lyrics: [] })
    }
  },
}))
