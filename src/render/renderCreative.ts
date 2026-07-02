import type { CanvasDims, CreativeImages, CreativeState } from '../types'
import { FONTS } from '../state/presets'
import { computeHeroPlacement } from './geometry'
import { applyLetterSpacing, layoutLines, tokenizeHeadline, type RenderLine } from './text'

/** Layout constants in export space (canvas is always 1080px wide). */
const SIDE_MARGIN = 72
const BADGE_FONT = 34
const BADGE_PAD_X = 26
const BADGE_PAD_Y = 13
const HEADLINE_GAP = 40
const AVATAR = 104
const PROFILE_MARGIN_X = 72
const DOT_COUNT = 7
const MIN_FONT = 24
const MAX_FONT = 190

const UI_FONT = '"Inter", system-ui, sans-serif'

export interface HeadlineRegion {
  top: number
  bottom: number
  align: 'center' | 'left'
}

export interface Regions {
  badgeBottom: number
  headline: HeadlineRegion
  profileTop: number
  dotsY: number
}

export function computeRegions(state: CreativeState, dims: CanvasDims): Regions {
  const { badge, profile } = state
  const badgeTopY = (badge.posY / 100) * dims.h
  const badgeHeight = BADGE_FONT + BADGE_PAD_Y * 2
  const badgeBottom = badge.enabled ? badgeTopY + badgeHeight : badgeTopY

  const dotsY = dims.h - 58
  const profileBottomAnchor = profile.dots ? dotsY - 44 : dims.h - 64
  const profileTop = profileBottomAnchor - AVATAR

  const headlineTop = badgeBottom + HEADLINE_GAP
  const headlineBottom = profile.enabled
    ? profileTop - 40
    : profile.dots
      ? dotsY - 32
      : dims.h - 72

  return {
    badgeBottom,
    headline: { top: headlineTop, bottom: headlineBottom, align: state.headline.align },
    profileTop,
    dotsY,
  }
}

export interface HeadlineLayout {
  lines: RenderLine[]
  fontSize: number
  lineHeightPx: number
  blockHeight: number
}

/**
 * Compute the headline layout: wrap lines and pick the font size. When the size
 * is `auto`, binary-search the largest size where every line fits `maxWidth`
 * and the whole block fits between the badge and the profile row.
 */
export function computeHeadlineLayout(
  ctx: CanvasRenderingContext2D,
  state: CreativeState,
  region: HeadlineRegion,
): HeadlineLayout {
  const { headline, style } = state
  const words = tokenizeHeadline(headline)
  const highlighted = new Set(headline.highlightIndices)
  const fontKey = style.font
  const availWidth = headline.maxWidth
  const availHeight = Math.max(0, region.bottom - region.top)

  const fits = (size: number): { ok: boolean; lines: RenderLine[] } => {
    const lines = layoutLines(ctx, {
      words,
      highlighted,
      fontKey,
      fontSize: size,
      maxWidth: availWidth,
      letterSpacing: headline.letterSpacing,
    })
    const maxLineWidth = lines.reduce((m, l) => Math.max(m, l.width), 0)
    const blockHeight = lines.length * size * headline.lineHeight
    return { ok: maxLineWidth <= availWidth + 0.5 && blockHeight <= availHeight, lines }
  }

  let size: number
  let lines: RenderLine[]

  if (headline.manualFontSize != null) {
    size = headline.manualFontSize
    lines = fits(size).lines
  } else {
    let lo = MIN_FONT
    let hi = MAX_FONT
    let best = MIN_FONT
    for (let i = 0; i < 22; i += 1) {
      const mid = (lo + hi) / 2
      if (fits(mid).ok) {
        best = mid
        lo = mid
      } else {
        hi = mid
      }
    }
    size = Math.floor(best)
    lines = fits(size).lines
  }

  const lineHeightPx = size * headline.lineHeight
  return { lines, fontSize: size, lineHeightPx, blockHeight: lines.length * lineHeightPx }
}

/**
 * The single source of truth for drawing a creative. Pure w.r.t. its inputs so
 * it can render both the live preview and the export bitmap identically.
 */
export function renderCreative(
  ctx: CanvasRenderingContext2D,
  state: CreativeState,
  images: CreativeImages,
  dims: CanvasDims,
): void {
  ctx.save()
  ctx.clearRect(0, 0, dims.w, dims.h)

  drawBackground(ctx, state, images, dims)
  drawFade(ctx, state, dims)

  const regions = computeRegions(state, dims)

  const layout = computeHeadlineLayout(ctx, state, regions.headline)
  drawHeadline(ctx, state, regions, layout, dims)

  if (state.badge.enabled) drawBadge(ctx, state, dims)
  if (state.profile.enabled) drawProfile(ctx, state, images, regions, dims)

  ctx.restore()
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  state: CreativeState,
  images: CreativeImages,
  dims: CanvasDims,
): void {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, dims.w, dims.h)

  if (images.hero) {
    const p = computeHeroPlacement(images.hero, dims, state.background)
    ctx.drawImage(images.hero, p.drawX, p.drawY, p.drawW, p.drawH)
  } else {
    drawHeroPlaceholder(ctx, dims)
  }
}

function drawHeroPlaceholder(ctx: CanvasRenderingContext2D, dims: CanvasDims): void {
  ctx.fillStyle = '#3a3a3f'
  ctx.fillRect(0, 0, dims.w, dims.h)
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  applyLetterSpacing(ctx, 4)
  ctx.font = `800 44px ${UI_FONT}`
  ctx.fillText('YOUR PHOTO', dims.w / 2, dims.h * 0.28)
  ctx.restore()
}

function drawFade(ctx: CanvasRenderingContext2D, state: CreativeState, dims: CanvasDims): void {
  const startY = (state.background.fadeStart / 100) * dims.h
  const endY = (state.background.fadeEnd / 100) * dims.h

  if (endY > startY) {
    const grad = ctx.createLinearGradient(0, startY, 0, endY)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = grad
    ctx.fillRect(0, startY, dims.w, endY - startY)
  }

  // Everything below fade-end is solid black.
  const solidTop = Math.max(startY, endY)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, solidTop, dims.w, dims.h - solidTop)
}

function drawBadge(ctx: CanvasRenderingContext2D, state: CreativeState, dims: CanvasDims): void {
  const { badge, headline } = state
  ctx.save()
  applyLetterSpacing(ctx, 1)
  ctx.font = `800 ${BADGE_FONT}px ${UI_FONT}`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  const text = badge.text
  const textW = ctx.measureText(text).width
  const boxW = textW + BADGE_PAD_X * 2
  const boxH = BADGE_FONT + BADGE_PAD_Y * 2
  const topY = (badge.posY / 100) * dims.h
  const x = headline.align === 'left' ? SIDE_MARGIN : (dims.w - boxW) / 2

  roundRect(ctx, x, topY, boxW, boxH, badge.radius)
  ctx.fillStyle = badge.bgColor
  ctx.fill()

  ctx.fillStyle = badge.textColor
  ctx.fillText(text, x + BADGE_PAD_X, topY + BADGE_PAD_Y + 1)
  ctx.restore()
}

function drawHeadline(
  ctx: CanvasRenderingContext2D,
  state: CreativeState,
  regions: Regions,
  layout: HeadlineLayout,
  dims: CanvasDims,
): void {
  const { headline, style } = state
  const def = FONTS[style.font]
  const { fontSize, lineHeightPx, lines } = layout

  ctx.save()
  ctx.font = `${def.weight} ${fontSize}px ${def.family}`
  applyLetterSpacing(ctx, headline.letterSpacing)
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  const spaceWidth = ctx.measureText(' ').width
  const glyphInset = (lineHeightPx - fontSize) / 2
  const blockTop = regions.headline.top

  lines.forEach((line, i) => {
    const glyphTop = blockTop + i * lineHeightPx + glyphInset
    const startX =
      headline.align === 'left' ? SIDE_MARGIN : (dims.w - line.width) / 2

    // Pre-compute token x positions.
    let x = startX
    const positions = line.tokens.map((t) => {
      const pos = x
      x += t.width + spaceWidth
      return pos
    })

    // Background boxes for the "box" highlight style (drawn under text).
    if (headline.highlightStyle === 'box') {
      drawHighlightBoxes(ctx, line, positions, glyphTop, fontSize, headline.highlightColor)
    }

    line.tokens.forEach((token, ti) => {
      const tx = positions[ti]
      drawToken(ctx, token, tx, glyphTop, fontSize, headline)
    })
  })

  ctx.restore()
}

function drawHighlightBoxes(
  ctx: CanvasRenderingContext2D,
  line: RenderLine,
  positions: number[],
  glyphTop: number,
  fontSize: number,
  color: string,
): void {
  const padX = fontSize * 0.12
  const boxTop = glyphTop - fontSize * 0.06
  const boxH = fontSize * 1.14
  let runStart = -1
  const flush = (endIdx: number) => {
    if (runStart < 0) return
    const x0 = positions[runStart] - padX
    const last = line.tokens[endIdx]
    const x1 = positions[endIdx] + last.width + padX
    ctx.save()
    ctx.fillStyle = color
    roundRect(ctx, x0, boxTop, x1 - x0, boxH, fontSize * 0.08)
    ctx.fill()
    ctx.restore()
    runStart = -1
  }
  line.tokens.forEach((token, i) => {
    if (token.highlighted) {
      if (runStart < 0) runStart = i
    } else {
      flush(i - 1)
    }
  })
  flush(line.tokens.length - 1)
}

function drawToken(
  ctx: CanvasRenderingContext2D,
  token: { text: string; highlighted: boolean; width: number },
  x: number,
  glyphTop: number,
  fontSize: number,
  headline: CreativeState['headline'],
): void {
  const { highlightStyle, highlightColor, dropShadow } = headline
  ctx.save()

  if (dropShadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = fontSize * 0.08
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = fontSize * 0.03
  }

  if (token.highlighted) {
    switch (highlightStyle) {
      case 'text':
        ctx.fillStyle = highlightColor
        ctx.fillText(token.text, x, glyphTop)
        break
      case 'text-underline':
        ctx.fillStyle = highlightColor
        ctx.fillText(token.text, x, glyphTop)
        ctx.shadowColor = 'transparent'
        ctx.fillRect(x, glyphTop + fontSize * 1.02, token.width, Math.max(3, fontSize * 0.06))
        break
      case 'box':
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = 'transparent'
        ctx.fillText(token.text, x, glyphTop)
        break
      case 'outline':
        ctx.lineJoin = 'round'
        ctx.lineWidth = Math.max(2, fontSize * 0.06)
        ctx.strokeStyle = highlightColor
        ctx.strokeText(token.text, x, glyphTop)
        ctx.shadowColor = 'transparent'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(token.text, x, glyphTop)
        break
    }
  } else {
    ctx.fillStyle = '#ffffff'
    ctx.fillText(token.text, x, glyphTop)
  }

  ctx.restore()
}

const IG_RING_COLORS = ['#feda75', '#fa7e1e', '#d62976', '#962fbf', '#4f5bd5', '#feda75']

function drawProfile(
  ctx: CanvasRenderingContext2D,
  state: CreativeState,
  images: CreativeImages,
  regions: Regions,
  dims: CanvasDims,
): void {
  const { profile } = state
  const cx = PROFILE_MARGIN_X + AVATAR / 2
  const cy = regions.profileTop + AVATAR / 2
  const r = AVATAR / 2

  ctx.save()

  // Instagram gradient ring.
  if (profile.ring) {
    const conic = createConic(ctx, cx, cy)
    ctx.beginPath()
    ctx.arc(cx, cy, r + 8, 0, Math.PI * 2)
    ctx.fillStyle = conic
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2)
    ctx.fillStyle = '#000000'
    ctx.fill()
  }

  // Avatar (clipped circle).
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  if (images.avatar) {
    ctx.drawImage(images.avatar, cx - r, cy - r, AVATAR, AVATAR)
  } else {
    ctx.fillStyle = '#5a5a60'
    ctx.fillRect(cx - r, cy - r, AVATAR, AVATAR)
    // simple head/shoulders glyph
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.beginPath()
    ctx.arc(cx, cy - r * 0.18, r * 0.34, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy + r * 0.62, r * 0.62, Math.PI, 0)
    ctx.fill()
  }
  ctx.restore()

  // Text block.
  const textX = PROFILE_MARGIN_X + AVATAR + 26
  const nickSize = 32
  const bylineSize = 25
  const gap = 8
  const totalTextH = nickSize + gap + bylineSize
  const nickTop = cy - totalTextH / 2

  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  applyLetterSpacing(ctx, 0)

  ctx.font = `700 ${nickSize}px ${UI_FONT}`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(profile.nickname, textX, nickTop)
  const nickW = ctx.measureText(profile.nickname).width

  if (profile.verified) {
    drawVerified(ctx, textX + nickW + 14, nickTop + nickSize / 2, nickSize * 0.44)
  }

  ctx.font = `400 ${bylineSize}px ${UI_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.62)'
  ctx.fillText(profile.byline, textX, nickTop + nickSize + gap)

  // Carousel dots.
  if (profile.dots) {
    drawDots(ctx, regions.dotsY, dims)
  }

  ctx.restore()
}

function drawVerified(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = '#4a9eff'
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = Math.max(2, r * 0.22)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.42, cy + r * 0.02)
  ctx.lineTo(cx - r * 0.08, cy + r * 0.38)
  ctx.lineTo(cx + r * 0.46, cy - r * 0.34)
  ctx.stroke()
  ctx.restore()
}

function drawDots(ctx: CanvasRenderingContext2D, y: number, dims: CanvasDims): void {
  const rActive = 5.5
  const rDot = 4.5
  const gap = 22
  const totalW = (DOT_COUNT - 1) * gap
  const startX = dims.w / 2 - totalW / 2
  for (let i = 0; i < DOT_COUNT; i += 1) {
    const x = startX + i * gap
    ctx.beginPath()
    ctx.arc(x, y, i === 0 ? rActive : rDot, 0, Math.PI * 2)
    ctx.fillStyle = i === 0 ? '#4a9eff' : 'rgba(255,255,255,0.4)'
    ctx.fill()
  }
}

function createConic(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
): CanvasGradient {
  const c = ctx as CanvasRenderingContext2D & {
    createConicGradient?: (a: number, x: number, y: number) => CanvasGradient
  }
  if (typeof c.createConicGradient === 'function') {
    const g = c.createConicGradient(-Math.PI / 2, cx, cy)
    IG_RING_COLORS.forEach((color, i) => {
      g.addColorStop(i / (IG_RING_COLORS.length - 1), color)
    })
    return g
  }
  const g = ctx.createLinearGradient(cx - AVATAR, cy - AVATAR, cx + AVATAR, cy + AVATAR)
  g.addColorStop(0, '#feda75')
  g.addColorStop(0.5, '#d62976')
  g.addColorStop(1, '#4f5bd5')
  return g
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}
