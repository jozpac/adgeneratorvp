import { useCallback, useEffect, useRef } from 'react'
import type { CreativeImages, CreativeState } from '../types'
import { FORMAT_DIMS } from '../state/presets'
import { renderCreative } from '../render/renderCreative'
import { computeHeroPlacement } from '../render/geometry'

interface Props {
  state: CreativeState
  images: CreativeImages
  imagesVersion: number
  onPan: (offsetX: number, offsetY: number) => void
  onZoom: (zoom: number, offsetX: number, offsetY: number) => void
  registerCanvas: (canvas: HTMLCanvasElement | null) => void
}

export function CanvasPreview({
  state,
  images,
  imagesVersion,
  onPan,
  onZoom,
  registerCanvas,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  // Keep the freshest inputs available to interaction handlers without
  // re-binding listeners on every state change.
  const stateRef = useRef(state)
  stateRef.current = state
  const imagesRef = useRef(images)
  imagesRef.current = images

  const dims = FORMAT_DIMS[state.format]

  const scheduleRender = useCallback(() => {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      renderCreative(ctx, stateRef.current, imagesRef.current, FORMAT_DIMS[stateRef.current.format])
    })
  }, [])

  // Re-render whenever state, images or format change.
  useEffect(() => {
    scheduleRender()
  }, [state, imagesVersion, scheduleRender])

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        // Reset the ref so a remount (e.g. React StrictMode's double-invoke in
        // dev) can schedule a fresh frame instead of being blocked by the guard.
        rafRef.current = null
      }
    }
  }, [])

  // --- Pan / zoom interaction -------------------------------------------------

  const cssToExport = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return 1
    const rect = canvas.getBoundingClientRect()
    return FORMAT_DIMS[stateRef.current.format].w / rect.width
  }, [])

  const clampOffsets = useCallback(
    (desiredX: number, desiredY: number) => {
      const img = imagesRef.current.hero
      const d = FORMAT_DIMS[stateRef.current.format]
      if (!img) return { x: 0, y: 0 }
      const p = computeHeroPlacement(
        img,
        d,
        { ...stateRef.current.background, offsetX: desiredX, offsetY: desiredY },
      )
      return { x: p.clampedOffsetX, y: p.clampedOffsetY }
    },
    [],
  )

  // Pointer bookkeeping (supports single-pointer pan + two-pointer pinch).
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.focus()
    if (!imagesRef.current.hero) return
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        zoom: stateRef.current.background.zoom,
      }
    }
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const prev = pointers.current.get(e.pointerId)
      if (!prev || !imagesRef.current.hero) return
      const scale = cssToExport()

      if (pointers.current.size >= 2 && pinchRef.current) {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        const [a, b] = [...pointers.current.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const factor = dist / pinchRef.current.dist
        const nextZoom = clamp(pinchRef.current.zoom * factor, 1, 3)
        const bg = stateRef.current.background
        const c = clampOffsets(bg.offsetX, bg.offsetY)
        onZoom(nextZoom, c.x, c.y)
        return
      }

      const dx = (e.clientX - prev.x) * scale
      const dy = (e.clientY - prev.y) * scale
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const bg = stateRef.current.background
      const c = clampOffsets(bg.offsetX + dx, bg.offsetY + dy)
      onPan(c.x, c.y)
    },
    [cssToExport, clampOffsets, onPan, onZoom],
  )

  const endPointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchRef.current = null
  }, [])

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      if (!imagesRef.current.hero) return
      const canvas = canvasRef.current
      if (!canvas) return
      e.preventDefault()

      const d = FORMAT_DIMS[stateRef.current.format]
      const rect = canvas.getBoundingClientRect()
      const scale = d.w / rect.width
      const cx = (e.clientX - rect.left) * scale
      const cy = (e.clientY - rect.top) * scale

      const bg = stateRef.current.background
      const before = computeHeroPlacement(imagesRef.current.hero, d, bg)
      const nextZoom = clamp(bg.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), 1, 3)

      // Keep the point under the cursor stationary while zooming.
      const ratio = nextZoom / bg.zoom
      const newDrawW = before.drawW * ratio
      const newDrawH = before.drawH * ratio
      const newDrawX = cx - (cx - before.drawX) * ratio
      const newDrawY = cy - (cy - before.drawY) * ratio
      const desiredOffsetX = newDrawX - (d.w - newDrawW) / 2
      const desiredOffsetY = newDrawY - (d.h - newDrawH) / 2

      const p = computeHeroPlacement(imagesRef.current.hero, d, {
        ...bg,
        zoom: nextZoom,
        offsetX: desiredOffsetX,
        offsetY: desiredOffsetY,
      })
      onZoom(nextZoom, p.clampedOffsetX, p.clampedOffsetY)
    },
    [onZoom],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLCanvasElement>) => {
      if (!imagesRef.current.hero) return
      const step = e.shiftKey ? 10 : 1
      let dx = 0
      let dy = 0
      if (e.key === 'ArrowLeft') dx = -step
      else if (e.key === 'ArrowRight') dx = step
      else if (e.key === 'ArrowUp') dy = -step
      else if (e.key === 'ArrowDown') dy = step
      else return
      e.preventDefault()
      const bg = stateRef.current.background
      const c = clampOffsets(bg.offsetX + dx, bg.offsetY + dy)
      onPan(c.x, c.y)
    },
    [clampOffsets, onPan],
  )

  return (
    <canvas
      ref={(el) => {
        canvasRef.current = el
        registerCanvas(el)
      }}
      width={dims.w}
      height={dims.h}
      tabIndex={0}
      className="canvas-focus-ring block h-auto w-auto max-h-[80vh] max-w-full touch-none rounded-lg shadow-2xl"
      style={{ aspectRatio: `${dims.w} / ${dims.h}`, cursor: images.hero ? 'grab' : 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onWheel={onWheel}
      onKeyDown={onKeyDown}
    />
  )
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
