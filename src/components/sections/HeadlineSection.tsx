import type { HeadlineState, HighlightStyle, TextAlign } from '../../types'
import { tokenizeHeadline } from '../../render/text'
import { HIGHLIGHT_PRESETS } from '../../state/defaults'
import {
  ColorInput,
  Field,
  Section,
  Segmented,
  Slider,
  SwatchRow,
  TextArea,
  Toggle,
} from '../ui/controls'

interface Props {
  headline: HeadlineState
  lineCount: number
  autoFontSize: number
  onChange: (patch: Partial<HeadlineState>) => void
}

const STYLE_OPTIONS: { value: HighlightStyle; label: string }[] = [
  { value: 'text', label: 'Color' },
  { value: 'text-underline', label: 'Underline' },
  { value: 'box', label: 'Box' },
  { value: 'outline', label: 'Outline' },
]

export function HeadlineSection({ headline, lineCount, autoFontSize, onChange }: Props) {
  const words = tokenizeHeadline(headline)
  const highlighted = new Set(headline.highlightIndices)

  const toggleWord = (index: number) => {
    const next = new Set(highlighted)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    onChange({ highlightIndices: [...next].sort((a, b) => a - b) })
  }

  return (
    <Section title="Headline">
      <Field label="Text" hint={`${lineCount} line${lineCount === 1 ? '' : 's'}`}>
        <TextArea value={headline.text} rows={3} onChange={(v) => onChange({ text: v })} />
      </Field>

      <Toggle
        label="Auto-uppercase"
        checked={headline.uppercase}
        onChange={(v) => onChange({ uppercase: v })}
      />

      <Field label="Highlight words">
        <div className="flex flex-wrap gap-1.5">
          {words.length === 0 && <span className="text-xs text-zinc-500">Type a headline…</span>}
          {words.map((w) => (
            <button
              key={w.index}
              type="button"
              onClick={() => toggleWord(w.index)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                highlighted.has(w.index)
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {w.text}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Highlight color">
        <div className="flex flex-col gap-2">
          <SwatchRow
            value={headline.highlightColor}
            options={[...HIGHLIGHT_PRESETS]}
            onChange={(v) => onChange({ highlightColor: v })}
          />
          <ColorInput
            value={headline.highlightColor}
            onChange={(v) => onChange({ highlightColor: v })}
          />
        </div>
      </Field>

      <Field label="Highlight style">
        <Segmented
          value={headline.highlightStyle}
          options={STYLE_OPTIONS}
          onChange={(v) => onChange({ highlightStyle: v })}
        />
      </Field>

      <Field label="Alignment">
        <Segmented<TextAlign>
          value={headline.align}
          options={[
            { value: 'center', label: 'Center' },
            { value: 'left', label: 'Left' },
          ]}
          onChange={(v) => onChange({ align: v })}
        />
      </Field>

      <Field label="Max line width" hint={`${headline.maxWidth}px`}>
        <Slider
          value={headline.maxWidth}
          min={600}
          max={1040}
          step={10}
          onChange={(v) => onChange({ maxWidth: v })}
        />
      </Field>

      <Field label="Line height" hint={headline.lineHeight.toFixed(2)}>
        <Slider
          value={headline.lineHeight}
          min={1}
          max={1.5}
          step={0.01}
          onChange={(v) => onChange({ lineHeight: v })}
        />
      </Field>

      <Toggle
        label="Manual font size"
        checked={headline.manualFontSize != null}
        onChange={(v) => onChange({ manualFontSize: v ? autoFontSize : null })}
      />
      {headline.manualFontSize != null && (
        <Field label="Font size" hint={`${headline.manualFontSize}px`}>
          <Slider
            value={headline.manualFontSize}
            min={24}
            max={200}
            onChange={(v) => onChange({ manualFontSize: v })}
          />
        </Field>
      )}

      <Toggle
        label="Drop shadow"
        checked={headline.dropShadow}
        onChange={(v) => onChange({ dropShadow: v })}
      />
    </Section>
  )
}
