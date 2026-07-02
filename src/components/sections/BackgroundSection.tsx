import { useRef, useState } from 'react'
import type { BackgroundState } from '../../types'
import { Button, Field, Section, Slider } from '../ui/controls'

interface Props {
  bg: BackgroundState
  hasImage: boolean
  onChange: (patch: Partial<BackgroundState>) => void
  onFile: (file: File) => void
  onCenter: () => void
}

export function BackgroundSection({ bg, hasImage, onChange, onFile, onCenter }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <Section title="Background Image">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files?.[0]
          if (file) onFile(file)
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-3 py-6 text-center text-xs transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-white/15 hover:border-white/30'
        }`}
      >
        <span className="text-zinc-300">
          {hasImage ? 'Replace photo' : 'Drop a photo or click to upload'}
        </span>
        <span className="text-zinc-500">PNG / JPG · large images auto-downscaled</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
            e.target.value = ''
          }}
        />
      </div>

      <Field label="Zoom" hint={`${Math.round(bg.zoom * 100)}%`}>
        <Slider
          value={bg.zoom}
          min={1}
          max={3}
          step={0.01}
          onChange={(v) => onChange({ zoom: v })}
        />
      </Field>

      <div className="flex gap-2">
        <Button onClick={onCenter}>Center</Button>
        <p className="flex-1 self-center text-[11px] leading-tight text-zinc-500">
          Drag on the canvas to pan · scroll to zoom · arrow keys to nudge
        </p>
      </div>

      <Field label="Fade start" hint={`${bg.fadeStart}%`}>
        <Slider
          value={bg.fadeStart}
          min={0}
          max={100}
          onChange={(v) => onChange({ fadeStart: Math.min(v, bg.fadeEnd) })}
        />
      </Field>

      <Field label="Fade end / fully black" hint={`${bg.fadeEnd}%`}>
        <Slider
          value={bg.fadeEnd}
          min={0}
          max={100}
          onChange={(v) => onChange({ fadeEnd: Math.max(v, bg.fadeStart) })}
        />
      </Field>
    </Section>
  )
}
