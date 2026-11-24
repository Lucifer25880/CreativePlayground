import type { ExperimentConfig, ConfigValue } from '@/types/config'

/** Deep clone of a JSON-serializable value. */
export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value
  return JSON.parse(JSON.stringify(value)) as T
}

/** Merge defaults with a partial override (shallow per-key, deep for objects). */
export function mergeConfig(
  defaults: ExperimentConfig,
  overrides?: ExperimentConfig,
): ExperimentConfig {
  const out: ExperimentConfig = deepClone(defaults)
  if (!overrides) return out
  for (const key of Object.keys(overrides)) {
    const v = overrides[key]
    if (v !== undefined && v !== null) out[key] = deepClone(v)
  }
  return out
}

/** Return only the keys whose values differ from the reference config. */
export function diffConfig(
  reference: ExperimentConfig,
  current: ExperimentConfig,
): ExperimentConfig {
  const out: ExperimentConfig = {}
  const keys = new Set([...Object.keys(reference), ...Object.keys(current)])
  for (const key of keys) {
    const a = reference[key]
    const b = current[key]
    if (JSON.stringify(a) !== JSON.stringify(b)) out[key] = deepClone(b)
  }
  return out
}

export function isVectorLike(v: ConfigValue): v is { x: number; y: number } {
  return typeof v === 'object' && v !== null && 'x' in v && 'y' in v
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function randomInRange(min: number, max: number, step = 1): number {
  const steps = Math.round((max - min) / step)
  const r = Math.floor(Math.random() * (steps + 1))
  const v = min + r * step
  return Number(v.toFixed(4))
}
