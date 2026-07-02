/** Slugify the first `count` words of a headline for the export filename. */
export function slugifyHeadline(text: string, count = 4): string {
  const words = text
    .replace(/\n/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, count)
    .join(' ')

  const slug = words
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'creative'
}

/** A filesystem-friendly timestamp: YYYYMMDD-HHMMSS. */
export function timestamp(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  )
}
