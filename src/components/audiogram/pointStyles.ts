export type TextPointCacheKey = string

const cache = new Map<TextPointCacheKey, HTMLCanvasElement>()

export function textPointStyle(
  text: string,
  color: string,
  fontSize = 16,
  fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
): HTMLCanvasElement {
  const key = `${text}|${color}|${fontSize}|${fontFamily}`
  const existing = cache.get(key)
  if (existing) return existing

  const size = Math.max(24, fontSize * 2)
  const c = document.createElement('canvas')
  c.width = size
  c.height = size

  const ctx = c.getContext('2d')
  if (!ctx) return c

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = color
  ctx.font = `700 ${fontSize}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, size / 2, size / 2)

  cache.set(key, c)
  return c
}


