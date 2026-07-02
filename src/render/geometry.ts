import type { BackgroundState, CanvasDims } from '../types'

export interface HeroPlacement {
  drawX: number
  drawY: number
  drawW: number
  drawH: number
  /** Max absolute pan offset that still fully covers the canvas. */
  maxOffsetX: number
  maxOffsetY: number
  /** Offsets after clamping (what was actually used). */
  clampedOffsetX: number
  clampedOffsetY: number
}

/**
 * Compute where to draw the hero image so it always covers the full canvas
 * (cover-fit at minimum zoom), applying the user's zoom and clamped pan.
 */
export function computeHeroPlacement(
  img: { width: number; height: number },
  dims: CanvasDims,
  bg: BackgroundState,
): HeroPlacement {
  const coverScale = Math.max(dims.w / img.width, dims.h / img.height)
  const scale = coverScale * Math.max(1, bg.zoom)
  const drawW = img.width * scale
  const drawH = img.height * scale

  const maxOffsetX = Math.max(0, (drawW - dims.w) / 2)
  const maxOffsetY = Math.max(0, (drawH - dims.h) / 2)

  const clampedOffsetX = clamp(bg.offsetX, -maxOffsetX, maxOffsetX)
  const clampedOffsetY = clamp(bg.offsetY, -maxOffsetY, maxOffsetY)

  const drawX = (dims.w - drawW) / 2 + clampedOffsetX
  const drawY = (dims.h - drawH) / 2 + clampedOffsetY

  return { drawX, drawY, drawW, drawH, maxOffsetX, maxOffsetY, clampedOffsetX, clampedOffsetY }
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
