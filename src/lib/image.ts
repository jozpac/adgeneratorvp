const MAX_EDGE = 3000

/**
 * Read a File into an HTMLImageElement, downscaling anything whose long edge
 * exceeds MAX_EDGE so huge uploads (8000px photos) don't sit in memory.
 */
export async function fileToImage(file: File): Promise<HTMLImageElement> {
  const dataUrl = await readAsDataURL(file)
  const raw = await loadImage(dataUrl)

  const longEdge = Math.max(raw.width, raw.height)
  if (longEdge <= MAX_EDGE) return raw

  const scale = MAX_EDGE / longEdge
  const w = Math.round(raw.width * scale)
  const h = Math.round(raw.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return raw
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(raw, 0, 0, w, h)
  return loadImage(canvas.toDataURL('image/png'))
}

export function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image decode failed'))
    img.src = src
  })
}
