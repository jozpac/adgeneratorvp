import type { CanvasFormat, FontKey, PresetKey, StyleState } from '../../types'
import {
  FONT_ORDER,
  FONTS,
  FORMAT_LABELS,
  FORMAT_ORDER,
  PRESET_ORDER,
  PRESETS,
} from '../../state/presets'
import { Field, Section, Select } from '../ui/controls'

interface Props {
  style: StyleState
  format: CanvasFormat
  onPreset: (preset: PresetKey) => void
  onFont: (font: FontKey) => void
  onFormat: (format: CanvasFormat) => void
}

export function LayoutSection({ style, format, onPreset, onFont, onFormat }: Props) {
  return (
    <Section title="Layout & Style">
      <Field label="Headline preset">
        <Select<PresetKey>
          value={style.preset}
          options={PRESET_ORDER.map((k) => ({ value: k, label: PRESETS[k].label }))}
          onChange={onPreset}
        />
      </Field>

      <Field label="Font override">
        <Select<FontKey>
          value={style.font}
          options={FONT_ORDER.map((k) => ({ value: k, label: FONTS[k].label }))}
          onChange={onFont}
        />
      </Field>

      <Field label="Canvas format">
        <Select<CanvasFormat>
          value={format}
          options={FORMAT_ORDER.map((k) => ({ value: k, label: FORMAT_LABELS[k] }))}
          onChange={onFormat}
        />
      </Field>
    </Section>
  )
}
