export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds === Infinity) return '00:00'
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function formatPlayCount(count: number): string {
  if (count >= 100000000) return `${(count / 100000000).toFixed(1)}亿`
  if (count >= 10000) return `${(count / 10000).toFixed(0)}万`
  return String(count)
}

export function getArtistNames(artists: { name: string }[]): string {
  return artists?.map((a) => a.name).join(' / ') || '未知艺术家'
}

/** Convert HTTP image URLs to HTTPS to prevent mixed-content errors */
export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) return ''
  return url.replace(/^http:\/\//i, 'https://')
}

export function getSongImage(song: { album?: { picUrl?: string } }): string {
  return normalizeImageUrl(song.album?.picUrl)
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
