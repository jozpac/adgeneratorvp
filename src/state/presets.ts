import type { CanvasDims, CanvasFormat, FontKey, PresetKey } from '../types'

export interface FontDef {
  key: FontKey
  label: string
  /** CSS font-family string usable in ctx.font. */
  family: string
  /** Numeric weight to request from the FontFace / used in ctx.font. */
  weight: number
}

/** The 5 supported display fonts. Families match Google Fonts family names. */
export const FONTS: Record<FontKey, FontDef> = {
  anton: { key: 'anton', label: 'Anton', family: '"Anton"', weight: 400 },
  archivo: { key: 'archivo', label: 'Archivo Black', family: '"Archivo Black"', weight: 400 },
  bebas: { key: 'bebas', label: 'Bebas Neue', family: '"Bebas Neue"', weight: 400 },
  inter: { key: 'inter', label: 'Inter ExtraBold', family: '"Inter"', weight: 800 },
  poppins: { key: 'poppins', label: 'Poppins Bold', family: '"Poppins"', weight: 700 },
}

export const FONT_ORDER: FontKey[] = ['anton', 'archivo', 'bebas', 'inter', 'poppins']

export interface PresetDef {
  key: PresetKey
  label: string
  font: FontKey
  uppercase: boolean
  /** Letter spacing in export px. */
  letterSpacing: number
}

/** Headline format presets that set font + casing + letter-spacing in one click. */
export const PRESETS: Record<PresetKey, PresetDef> = {
  impact: { key: 'impact', label: 'Impact News', font: 'anton', uppercase: true, letterSpacing: 0 },
  condensed: {
    key: 'condensed',
    label: 'Bold Condensed',
    font: 'archivo',
    uppercase: true,
    letterSpacing: 0,
  },
  tabloid: {
    key: 'tabloid',
    label: 'Tall Tabloid',
    font: 'bebas',
    uppercase: true,
    letterSpacing: 3,
  },
  modern: {
    key: 'modern',
    label: 'Clean Modern',
    font: 'inter',
    uppercase: false,
    letterSpacing: -1,
  },
  punchy: {
    key: 'punchy',
    label: 'Punchy Sans',
    font: 'poppins',
    uppercase: true,
    letterSpacing: 0,
  },
}

export const PRESET_ORDER: PresetKey[] = ['impact', 'condensed', 'tabloid', 'modern', 'punchy']

export const FORMAT_DIMS: Record<CanvasFormat, CanvasDims> = {
  '4:5': { w: 1080, h: 1350 },
  '1:1': { w: 1080, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
}

export const FORMAT_ORDER: CanvasFormat[] = ['4:5', '1:1', '9:16']

export const FORMAT_LABELS: Record<CanvasFormat, string> = {
  '4:5': '4:5 · Feed (1080×1350)',
  '1:1': '1:1 · Square (1080×1080)',
  '9:16': '9:16 · Story (1080×1920)',
}
