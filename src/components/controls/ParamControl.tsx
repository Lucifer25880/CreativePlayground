import { useState, useEffect } from 'react'
import type { ConfigValue, ParameterDefinition, SelectOption } from '@/types/config'

interface ParamControlProps {
  param: ParameterDefinition
  value: ConfigValue
  onChange: (value: ConfigValue) => void
}

export function ParamControl({ param, value, onChange }: ParamControlProps) {
  switch (param.type) {
    case 'number':
    case 'range':
      return <SliderControl param={param} value={value} onChange={onChange} />
    case 'boolean':
      return <ToggleControl param={param} value={value} onChange={onChange} />
    case 'color':
      return <ColorControl param={param} value={value} onChange={onChange} />
    case 'select':
      return <SelectControl param={param} value={value} onChange={onChange} />
    case 'vector2':
    case 'vector3':
      return <VectorControl param={param} value={value} onChange={onChange} />
    case 'string':
      return <StringControl param={param} value={value} onChange={onChange} />
    default:
      return <StringControl param={param} value={value} onChange={onChange} />
  }
}

/* ----------------------------- Slider ----------------------------- */

function SliderControl({ param, value, onChange }: ParamControlProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string>('')
  const num = typeof value === 'number' ? value : Number(value ?? param.defaultValue)
  const min = param.min ?? 0
  const max = param.max ?? 1
  const step = param.step ?? 0.01

  useEffect(() => {
    if (!editing) setDraft(String(round(num)))
  }, [num, editing])

  function commitText(text: string) {
    const parsed = parseFloat(text)
    if (!Number.isNaN(parsed)) {
      onChange(clampValue(parsed, min, max))
    }
    setEditing(false)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={num}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-[#7c6cff]"
        />
        <button
          onClick={() => {
            setEditing(true)
            setDraft(String(round(num)))
          }}
          className="w-16 shrink-0 rounded-md border border-white/10 bg-ink-900/70 px-2 py-1 text-right font-mono text-xs text-slate-200"
          title="Click to type exact value"
        >
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commitText(draft)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitText(draft)
                if (e.key === 'Escape') setEditing(false)
              }}
              className="w-full bg-transparent text-right font-mono text-xs text-slate-100 outline-none"
            />
          ) : (
            <span>
              {round(num)}
              {param.unit ?? ''}
            </span>
          )}
        </button>
      </div>
      {(param.min !== undefined || param.description) && (
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>{param.min !== undefined ? `${param.min} — ${param.max}` : ''}</span>
        </div>
      )}
    </div>
  )
}

/* ----------------------------- Toggle ----------------------------- */

function ToggleControl({ param, value, onChange }: ParamControlProps) {
  const on = Boolean(value)
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        on ? 'bg-accent' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

/* ----------------------------- Color ------------------------------ */

function ColorControl({ param, value, onChange }: ParamControlProps) {
  const color = typeof value === 'string' ? value : '#7c6cff'
  return (
    <div className="flex items-center gap-2">
      <label className="relative h-9 w-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/10">
        <input
          type="color"
          value={normalizeHex(color)}
          onChange={(e) => onChange(e.target.value)}
          className="absolute -inset-2 h-[150%] w-[150%] cursor-pointer"
        />
        <span className="pointer-events-none absolute inset-0" style={{ background: normalizeHex(color) }} />
      </label>
      <input
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="input-base font-mono text-xs"
        spellCheck={false}
      />
    </div>
  )
}

/* ----------------------------- Select ----------------------------- */

function SelectControl({ param, value, onChange }: ParamControlProps) {
  const options: SelectOption[] = param.options ?? []
  const current = String(value)
  return (
    <select
      value={current}
      onChange={(e) => {
        const opt = options.find((o) => String(o.value) === e.target.value)
        onChange(opt ? opt.value : e.target.value)
      }}
      className="input-base cursor-pointer"
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)} className="bg-ink-800">
          {o.label}
        </option>
      ))}
    </select>
  )
}

/* ----------------------------- String ----------------------------- */

function StringControl({ param, value, onChange }: ParamControlProps) {
  return (
    <input
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      className="input-base"
      spellCheck={false}
    />
  )
}

/* ----------------------------- Vector ----------------------------- */

function VectorControl({ param, value, onChange }: ParamControlProps) {
  const v = (value && typeof value === 'object' && 'x' in value
    ? value
    : { x: 0, y: 0, z: 0 }) as { x: number; y: number; z?: number }
  const dims = param.type === 'vector3' ? 3 : 2
  const labels = ['x', 'y', 'z'].slice(0, dims)
  const min = param.min ?? 0
  const max = param.max ?? 1

  return (
    <div className="grid grid-cols-2 gap-2">
      {labels.map((axis) => {
        const current = axis === 'z' ? (v.z ?? 0) : (v[axis as 'x' | 'y'] as number)
        return (
          <label key={axis} className="flex items-center gap-1.5">
            <span className="w-3 text-center font-mono text-xs text-slate-400">{axis}</span>
            <input
              type="number"
              step={(param.step ?? 0.01)}
              value={current}
              onChange={(e) => {
                const n = parseFloat(e.target.value)
                if (Number.isNaN(n)) return
                const next = { ...v, [axis]: clampValue(n, min, max) } as { x: number; y: number; z?: number }
                onChange(param.type === 'vector3' ? { x: next.x, y: next.y, z: next.z ?? 0 } : { x: next.x, y: next.y })
              }}
              className="input-base px-2 py-1 font-mono text-xs"
            />
          </label>
        )
      })}
    </div>
  )
}

/* ----------------------------- Helpers ---------------------------- */

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}

function clampValue(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function normalizeHex(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color
  if (/^#[0-9a-fA-F]{3}$/.test(color)) return color
  // accept css color words by mapping a few common ones
  const named: Record<string, string> = { red: '#ff0000', blue: '#0000ff', white: '#ffffff', black: '#000000' }
  return named[color.toLowerCase()] ?? '#7c6cff'
}
