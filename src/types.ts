export type CanvasFormat = '4:5' | '1:1' | '9:16'

export type HighlightStyle = 'text' | 'text-underline' | 'box' | 'outline'

export type TextAlign = 'center' | 'left'

export type FontKey = 'anton' | 'archivo' | 'bebas' | 'inter' | 'poppins'

export type PresetKey = 'impact' | 'condensed' | 'tabloid' | 'modern' | 'punchy'

export interface BackgroundState {
  /** Zoom relative to cover-fit. 1.0 = exactly cover, up to 3.0. */
  zoom: number
  /** Pan offset in export pixels, applied to the image center. Clamped at render time. */
  offsetX: number
  offsetY: number
  /** % of canvas height where the gradient starts fading toward black. */
  fadeStart: number
  /** % of canvas height where the canvas becomes fully black. */
  fadeEnd: number
}

export interface HeadlineState {
  text: string
  uppercase: boolean
  /** Max line width in export pixels. */
  maxWidth: number
  /** null = auto (binary search); otherwise a forced font size in export px. */
  manualFontSize: number | null
  lineHeight: number
  align: TextAlign
  /** Global word indices (reading order) that are highlighted. */
  highlightIndices: number[]
  highlightColor: string
  highlightStyle: HighlightStyle
  dropShadow: boolean
  /** Letter spacing in export px. */
  letterSpacing: number
}

export interface BadgeState {
  enabled: boolean
  text: string
  bgColor: string
  textColor: string
  radius: number
  /** % of canvas height for the badge's vertical position (top of badge). */
  posY: number
}

export interface ProfileState {
  enabled: boolean
  nickname: string
  verified: boolean
  byline: string
  ring: boolean
  dots: boolean
}

export interface StyleState {
  preset: PresetKey
  font: FontKey
}

export interface CreativeState {
  format: CanvasFormat
  background: BackgroundState
  headline: HeadlineState
  badge: BadgeState
  profile: ProfileState
  style: StyleState
}

/** Runtime-only image handles — never persisted to localStorage. */
export interface CreativeImages {
  hero: HTMLImageElement | null
  /** Pre-cropped circular avatar rendered to a canvas. */
  avatar: HTMLCanvasElement | null
}

export interface CanvasDims {
  w: number
  h: number
}
