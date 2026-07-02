import type { ProfileState } from '../../types'
import { Button, Field, Section, TextInput, Toggle } from '../ui/controls'

interface Props {
  profile: ProfileState
  hasAvatar: boolean
  onChange: (patch: Partial<ProfileState>) => void
  onEditAvatar: () => void
  onRemoveAvatar: () => void
}

export function ProfileSection({
  profile,
  hasAvatar,
  onChange,
  onEditAvatar,
  onRemoveAvatar,
}: Props) {
  return (
    <Section title="Profile Row">
      <Toggle
        label="Show profile row"
        checked={profile.enabled}
        onChange={(v) => onChange({ enabled: v })}
      />

      <Field label="Profile photo">
        <div className="flex gap-2">
          <Button onClick={onEditAvatar}>{hasAvatar ? 'Edit photo' : 'Add photo'}</Button>
          {hasAvatar && <Button onClick={onRemoveAvatar}>Remove</Button>}
        </div>
      </Field>

      <Field label="Nickname">
        <TextInput value={profile.nickname} onChange={(v) => onChange({ nickname: v })} />
      </Field>

      <Toggle
        label="Verified checkmark"
        checked={profile.verified}
        onChange={(v) => onChange({ verified: v })}
      />

      <Field label="Byline / niche">
        <TextInput value={profile.byline} onChange={(v) => onChange({ byline: v })} />
      </Field>

      <Toggle
        label="Instagram gradient ring"
        checked={profile.ring}
        onChange={(v) => onChange({ ring: v })}
      />

      <Toggle
        label="Carousel dots"
        checked={profile.dots}
        onChange={(v) => onChange({ dots: v })}
      />
    </Section>
  )
}
