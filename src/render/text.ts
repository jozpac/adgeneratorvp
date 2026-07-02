import type { HeadlineState } from '../types'
import { FONTS } from '../state/presets'

export interface Word {
  text: string
  /** Global reading-order index used by the highlight chips. */
  index: number
  /** True if a manual line break precedes this word. */
  breakBefore: boolean
}

export interface RenderToken {
  text: string
  index: number
  highlighted: boolean
  /** Measured advance width of the token (no trailing space). */
  width: number
}

export interface RenderLine {
  tokens: RenderToken[]
  width: number
}

/**
 * Split the headline into words with stable global indices, honouring manual
 * line breaks. Casing is applied here so measurement matches rendering.
 */
export function tokenizeHeadline(headline: HeadlineState): Word[] {
  const source = headline.uppercase ? headline.text.toUpperCase() : headline.text
  const paragraphs = source.split('\n')
  const words: Word[] = []
  let index = 0
  paragraphs.forEach((para, pIdx) => {
    const parts = para.split(/\s+/).filter((w) => w.length > 0)
    parts.forEach((text, wIdx) => {
      words.push({ text, index, breakBefore: pIdx > 0 && wIdx === 0 })
      index += 1
    })
  })
  return words
}

export interface LayoutInput {
  words: Word[]
  highlighted: Set<number>
  fontKey: keyof typeof FONTS
  fontSize: number
  maxWidth: number
  letterSpacing: number
}

/**
 * Wrap words into lines that fit `maxWidth` at the given font size, honouring
 * manual breaks. Requires the ctx to already have letterSpacing applied by the
 * caller-provided font string; we set both here for correctness.
 */
export function layoutLines(ctx: CanvasRenderingContext2D, input: LayoutInput): RenderLine[] {
  const { words, highlighted, fontKey, fontSize, maxWidth, letterSpacing } = input
  const def = FONTS[fontKey]
  ctx.font = `${def.weight} ${fontSize}px ${def.family}`
  applyLetterSpacing(ctx, letterSpacing)

  const spaceWidth = measure(ctx, ' ')
  const lines: RenderLine[] = []
  let current: RenderToken[] = []
  let currentWidth = 0

  const flush = () => {
    lines.push({ tokens: current, width: currentWidth })
    current = []
    currentWidth = 0
  }

  for (const word of words) {
    const w = measure(ctx, word.text)
    const token: RenderToken = {
      text: word.text,
      index: word.index,
      highlighted: highlighted.has(word.index),
      width: w,
    }

    if (word.breakBefore && current.length > 0) {
      flush()
    }

    if (current.length === 0) {
      current.push(token)
      currentWidth = w
      continue
    }

    const projected = currentWidth + spaceWidth + w
    if (projected > maxWidth) {
      flush()
      current.push(token)
      currentWidth = w
    } else {
      current.push(token)
      currentWidth = projected
    }
  }
  if (current.length > 0) flush()

  return lines
}

export function measure(ctx: CanvasRenderingContext2D, text: string): number {
  return ctx.measureText(text).width
}

/** letterSpacing is supported on the 2D context in modern Chromium/Firefox. */
export function applyLetterSpacing(ctx: CanvasRenderingContext2D, px: number): void {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
  if ('letterSpacing' in c) {
    c.letterSpacing = `${px}px`
  }
}
