import { useId, useState, type ReactNode } from 'react'

export function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold tracking-wide text-zinc-100 hover:bg-white/5"
      >
        <span>{title}</span>
        <span
          className={`text-zinc-500 transition-transform ${open ? 'rotate-90' : ''}`}
          aria-hidden
        >
          ▶
        </span>
      </button>
      {open && <div className="flex flex-col gap-4 px-4 pb-5 pt-1">{children}</div>}
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between text-xs font-medium text-zinc-400">
        <span>{label}</span>
        {hint && <span className="text-[11px] tabular-nums text-zinc-500">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
    />
  )
}

export function TextArea({
  value,
  onChange,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-y rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
    />
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3"
    >
      <span className="text-xs font-medium text-zinc-300">{label}</span>
      <span
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 rounded-md border border-white/10 bg-zinc-900 px-2 py-1.5 font-mono text-xs uppercase text-zinc-200 outline-none focus:border-blue-500"
      />
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-md border border-white/10 bg-zinc-900 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
            value === o.value ? 'bg-blue-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  const id = useId()
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}) {
  const base =
    'rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const styles =
    variant === 'primary'
      ? 'bg-blue-500 text-white hover:bg-blue-400'
      : 'border border-white/12 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  )
}

export function SwatchRow({
  value,
  options,
  onChange,
}: {
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.label}
          onClick={() => onChange(o.value)}
          style={{ background: o.value }}
          className={`h-7 w-7 rounded-full border-2 ${
            value.toLowerCase() === o.value.toLowerCase()
              ? 'border-white'
              : 'border-white/20'
          }`}
        />
      ))}
    </div>
  )
}
