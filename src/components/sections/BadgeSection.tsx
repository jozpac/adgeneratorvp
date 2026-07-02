import type { BadgeState } from '../../types'
import { ColorInput, Field, Section, Slider, TextInput, Toggle } from '../ui/controls'

interface Props {
  badge: BadgeState
  onChange: (patch: Partial<BadgeState>) => void
}

export function BadgeSection({ badge, onChange }: Props) {
  return (
    <Section title="Badge">
      <Toggle
        label="Show badge"
        checked={badge.enabled}
        onChange={(v) => onChange({ enabled: v })}
      />

      <Field label="Text">
        <TextInput value={badge.text} onChange={(v) => onChange({ text: v })} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Background">
          <ColorInput value={badge.bgColor} onChange={(v) => onChange({ bgColor: v })} />
        </Field>
        <Field label="Text color">
          <ColorInput value={badge.textColor} onChange={(v) => onChange({ textColor: v })} />
        </Field>
      </div>

      <Field label="Corner radius" hint={`${badge.radius}px`}>
        <Slider value={badge.radius} min={0} max={40} onChange={(v) => onChange({ radius: v })} />
      </Field>

      <Field label="Vertical position" hint={`${badge.posY.toFixed(1)}%`}>
        <Slider
          value={badge.posY}
          min={5}
          max={90}
          step={0.5}
          onChange={(v) => onChange({ posY: v })}
        />
      </Field>
    </Section>
  )
}
