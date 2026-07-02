import type { CreativeState } from '../types'

export const HIGHLIGHT_PRESETS = [
  { label: 'Blue', value: '#4A9EFF' },
  { label: 'Red', value: '#E21C21' },
  { label: 'Yellow', value: '#FFD60A' },
  { label: 'Green', value: '#3DDC84' },
] as const

export const DEMO_HEADLINE = 'This local coach just booked 30 clients in one week'

export function defaultState(): CreativeState {
  return {
    format: '4:5',
    background: {
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      fadeStart: 32,
      fadeEnd: 56,
    },
    headline: {
      text: DEMO_HEADLINE,
      uppercase: true,
      maxWidth: 1000,
      manualFontSize: null,
      lineHeight: 1.2,
      align: 'center',
      highlightIndices: [5, 6],
      highlightColor: '#4A9EFF',
      highlightStyle: 'text',
      dropShadow: true,
      letterSpacing: 0,
    },
    badge: {
      enabled: true,
      text: 'BREAKING NEWS',
      bgColor: '#E21C21',
      textColor: '#FFFFFF',
      radius: 6,
      posY: 48.5,
    },
    profile: {
      enabled: true,
      nickname: 'breaking.news',
      verified: true,
      byline: 'Jake Tran | YouTube',
      ring: true,
      dots: true,
    },
    style: {
      preset: 'impact',
      font: 'anton',
    },
  }
}
