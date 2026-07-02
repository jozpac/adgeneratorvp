import { useCallback, useEffect, useRef, useState } from 'react'
import { fileToImage } from '../lib/image'
import { Button, Slider } from './ui/controls'

const VIEW = 300
const OUTPUT = 256

interface Props {
  initialImage: HTMLImageElement | null
  onCancel: () => void
  onConfirm: (avatar: HTMLCanvasElement) => void
}

interface Placement {
  scale: number
  drawX: number
  drawY: number
  drawW: number
  drawH: number
}

function placement(img: HTMLImageElement, size: number, zoom: number, offX: number, offY: number): Placement {
  const cover = Math.max(size / img.width, size / img.height)
  const scale = cover * zoom
  const drawW = img.width * scale
  const drawH = img.height * scale
  const maxX = Math.max(0, (drawW - size) / 2)
  const maxY = Math.max(0, (drawH - size) / 2)
  const cx = Math.min(maxX, Math.max(-maxX, offX))
  const cy = Math.min(maxY, Math.max(-maxY, offY))
  return {
    scale,
    drawW,
    drawH,
    drawX: (size - drawW) / 2 + cx,
    drawY: (size - drawH) / 2 + cy,
  }
}

export function AvatarCropModal({ initialImage, onCancel, onConfirm }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(initialImage)
  const [zoom, setZoom] = useState(1)
  const [off, setOff] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, VIEW, VIEW)
    ctx.fillStyle = '#18181b'
    ctx.fillRect(0, 0, VIEW, VIEW)

    if (img) {
      const p = placement(img, VIEW, zoom, off.x, off.y)
      ctx.drawImage(img, p.drawX, p.drawY, p.drawW, p.drawH)
    }

    // Dim outside the circle using even-odd fill.
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, VIEW, VIEW)
    ctx.arc(VIEW / 2, VIEW / 2, VIEW / 2 - 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fill('evenodd')
    ctx.restore()

    ctx.beginPath()
    ctx.arc(VIEW / 2, VIEW / 2, VIEW / 2 - 2, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [img, zoom, off])

  useEffect(() => {
    draw()
  }, [draw])

  const onPointerDown = (e: React.PointerEvent) => {
    if (!img) return
    ;(e.target as Element).setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !img) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    setOff((o) => {
      const p = placement(img, VIEW, zoom, o.x + dx, o.y + dy)
      const maxX = Math.max(0, (p.drawW - VIEW) / 2)
      const maxY = Math.max(0, (p.drawH - VIEW) / 2)
      return {
        x: Math.min(maxX, Math.max(-maxX, o.x + dx)),
        y: Math.min(maxY, Math.max(-maxY, o.y + dy)),
      }
    })
  }
  const onPointerUp = () => {
    drag.current = null
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const loaded = await fileToImage(file)
    setImg(loaded)
    setZoom(1)
    setOff({ x: 0, y: 0 })
  }

  const confirm = () => {
    if (!img) return
    const out = document.createElement('canvas')
    out.width = OUTPUT
    out.height = OUTPUT
    const ctx = out.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingQuality = 'high'
    ctx.beginPath()
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2)
    ctx.clip()
    const ratio = OUTPUT / VIEW
    const p = placement(img, VIEW, zoom, off.x, off.y)
    ctx.drawImage(img, p.drawX * ratio, p.drawY * ratio, p.drawW * ratio, p.drawH * ratio)
    onConfirm(out)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-sm font-semibold text-zinc-100">Crop profile photo</h2>

        <div className="flex flex-col items-center gap-4">
          <canvas
            ref={canvasRef}
            width={VIEW}
            height={VIEW}
            className="touch-none rounded-lg"
            style={{ cursor: img ? 'grab' : 'default' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />

          {img ? (
            <label className="flex w-full items-center gap-3">
              <span className="text-xs text-zinc-400">Zoom</span>
              <Slider value={zoom} min={1} max={4} step={0.01} onChange={setZoom} />
            </label>
          ) : (
            <p className="text-xs text-zinc-500">Choose a photo to crop.</p>
          )}

          <label className="w-full cursor-pointer rounded-md border border-white/12 bg-zinc-800 px-3 py-2 text-center text-xs font-medium text-zinc-200 hover:bg-zinc-700">
            {img ? 'Choose a different photo' : 'Choose photo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={confirm} disabled={!img}>
            Use photo
          </Button>
        </div>
      </div>
    </div>
  )
}
