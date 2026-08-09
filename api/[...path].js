// Vercel Serverless Function - Proxy to NetEase Cloud Music API
const MUSIC_API_BASE = 'https://music-api.jerry-nis.top'

export default async function handler(req, res) {
  // Get the path after /api/
  const path = req.url?.replace(/^\/api/, '') || ''

  // Build target URL
  const url = `${MUSIC_API_BASE}${path}`

  // Forward cookies if present
  const headers = {}
  if (req.headers.cookie) {
    headers.cookie = req.headers.cookie
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })

    // Forward Set-Cookie headers
    const setCookies = response.headers.getSetCookie?.() || []
    if (setCookies.length > 0) {
      res.setHeader('Set-Cookie', setCookies)
    }

    // Forward content type
    const contentType = response.headers.get('content-type')
    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }

    const data = await response.text()
    res.status(response.status).send(data)
  } catch (error) {
    res.status(502).json({ error: 'Failed to reach music API', message: error.message })
  }
}
