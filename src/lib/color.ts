// Color utility functions for dynamic theming

export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  return [r, g, b]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h *= 60
  }
  return [h, s * 100, l * 100]
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  s /= 100
  l /= 100
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [r * 255, g * 255, b * 255]
}

// Lightness levels for each shade (50-900), tuned for vibrant palettes
const SHADE_LIGHTNESS: Record<number, number> = {
  50: 96,
  100: 91,
  200: 83,
  300: 72,
  400: 62,
  500: 53,
  600: 45,
  700: 37,
  800: 29,
  900: 21,
}

// Generate a full color palette (50-900) from a single hex color.
// Returns RGB channel strings (e.g. "59 130 246") for use with CSS variables.
export function generatePalette(baseHex: string): Record<number, string> {
  const [r, g, b] = hexToRgb(baseHex)
  const [h, s] = rgbToHsl(r, g, b)
  const palette: Record<number, string> = {}
  for (const [shade, lightness] of Object.entries(SHADE_LIGHTNESS)) {
    const [pr, pg, pb] = hslToRgb(h, Math.min(s, 88), lightness)
    palette[Number(shade)] = `${Math.round(pr)} ${Math.round(pg)} ${Math.round(pb)}`
  }
  return palette
}

// Apply a palette to CSS variables on the document root
export function applyPrimaryPalette(palette: Record<number, string>) {
  const root = document.documentElement
  for (const [shade, rgb] of Object.entries(palette)) {
    root.style.setProperty(`--primary-${shade}`, rgb)
  }
  // Also update --accent for components that use it directly
  const [r, g, b] = palette[500].split(' ').map(Number)
  root.style.setProperty('--accent', `rgb(${r} ${g} ${b})`)
  // Update decorative blob colors
  root.style.setProperty('--blob-1', `${r} ${g} ${b}`)
}

// Reset to default blue palette
const DEFAULT_BLUE = '#3b82f6'
export function applyDefaultPalette() {
  applyPrimaryPalette(generatePalette(DEFAULT_BLUE))
}

// ---------------------------------------------------------------------------
// Dynamic background theming
// ---------------------------------------------------------------------------

// Store the last extracted dynamic color so we can re-apply on theme switch
let dynamicBgHex: string | null = null

const BG_VARS = [
  '--bg-primary',
  '--bg-secondary',
  '--bg-tertiary',
  '--glass-bg',
  '--glass-bg-strong',
  '--glass-border',
  '--glass-shadow',
]

// Generate and apply background CSS variables derived from a base color.
// Produces different palettes for light vs dark mode so the background tint
// always matches the current theme.
export function applyDynamicBackground(baseHex: string, isDark: boolean) {
  dynamicBgHex = baseHex
  const [r, g, b] = hexToRgb(baseHex)
  const [h, s] = rgbToHsl(r, g, b)
  const root = document.documentElement

  if (isDark) {
    // Dark mode: very dark backgrounds with a subtle hue tint
    const sat = Math.min(s * 0.35, 35)
    const [pr, pg, pb] = hslToRgb(h, sat, 5)
    const [sr, sg, sb] = hslToRgb(h, sat + 5, 9)
    const [tr, tg, tb] = hslToRgb(h, sat + 8, 13)
    const prs = Math.round(pr), pgs = Math.round(pg), pbs = Math.round(pb)
    const srs = Math.round(sr), sgs = Math.round(sg), sbs = Math.round(sb)

    root.style.setProperty('--bg-primary', `rgb(${prs} ${pgs} ${pbs})`)
    root.style.setProperty('--bg-secondary', `rgb(${srs} ${sgs} ${sbs})`)
    root.style.setProperty('--bg-tertiary', `rgb(${Math.round(tr)} ${Math.round(tg)} ${Math.round(tb)})`)
    root.style.setProperty('--glass-bg', `rgba(${srs} ${sgs} ${sbs} / 0.08)`)
    root.style.setProperty('--glass-bg-strong', `rgba(${srs} ${sgs} ${sbs} / 0.12)`)
    root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)')
    root.style.setProperty('--glass-shadow', 'rgba(0, 0, 0, 0.35)')
  } else {
    // Light mode: very light backgrounds with a whisper of hue
    const sat = Math.min(s * 0.12, 18)
    const [pr, pg, pb] = hslToRgb(h, sat, 96)
    const [tr, tg, tb] = hslToRgb(h, sat + 3, 98)

    root.style.setProperty('--bg-primary', `rgb(${Math.round(pr)} ${Math.round(pg)} ${Math.round(pb)})`)
    root.style.setProperty('--bg-secondary', '#ffffff')
    root.style.setProperty('--bg-tertiary', `rgb(${Math.round(tr)} ${Math.round(tg)} ${Math.round(tb)})`)
    root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.65)')
    root.style.setProperty('--glass-bg-strong', 'rgba(255, 255, 255, 0.78)')
    root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.5)')
    root.style.setProperty('--glass-shadow', `rgba(${r} ${g} ${b}, 0.08)`)
  }
}

// Remove all dynamic background inline styles so CSS defaults take over
export function resetDynamicBackground() {
  dynamicBgHex = null
  const root = document.documentElement
  for (const v of BG_VARS) {
    root.style.removeProperty(v)
  }
}

// Re-apply the last dynamic background for a new theme mode.
// No-op if dynamic color was never set.
export function reapplyDynamicBackground(isDark: boolean) {
  if (dynamicBgHex) {
    applyDynamicBackground(dynamicBgHex, isDark)
  }
}

// Extract the dominant/vibrant color from an image URL using canvas
export function extractDominantColor(imgUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 60
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          reject(new Error('Canvas context unavailable'))
          return
        }
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data

        // Quantize pixels into buckets, score by count * vibrancy
        const buckets = new Map<
          string,
          { count: number; r: number; g: number; b: number; vibrancy: number }
        >()

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b
          // Skip near-black and near-white pixels
          if (luminance < 25 || luminance > 235) continue

          // Quantize to reduce unique colors
          const qr = Math.round(r / 20) * 20
          const qg = Math.round(g / 20) * 20
          const qb = Math.round(b / 20) * 20
          const key = `${qr},${qg},${qb}`

          const [h, s, l] = rgbToHsl(r, g, b)
          // Vibrancy: high saturation + medium lightness scores higher
          const vibrancy = s * (1 - Math.abs(l - 50) / 50)

          const existing = buckets.get(key)
          if (existing) {
            existing.count++
            existing.r += r
            existing.g += g
            existing.b += b
            existing.vibrancy += vibrancy
          } else {
            buckets.set(key, { count: 1, r, g, b, vibrancy })
          }
        }

        if (buckets.size === 0) {
          resolve(DEFAULT_BLUE)
          return
        }

        // Pick the bucket with best count * vibrancy score
        let bestScore = 0
        let bestColor = DEFAULT_BLUE
        for (const bucket of buckets.values()) {
          const avgR = bucket.r / bucket.count
          const avgG = bucket.g / bucket.count
          const avgB = bucket.b / bucket.count
          const avgVibrancy = bucket.vibrancy / bucket.count
          const score = bucket.count * avgVibrancy
          if (score > bestScore) {
            bestScore = score
            bestColor = rgbToHex(avgR, avgG, avgB)
          }
        }

        resolve(bestColor)
      } catch {
        // Canvas tainted by CORS — fall back to default
        resolve(DEFAULT_BLUE)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imgUrl
  })
}
