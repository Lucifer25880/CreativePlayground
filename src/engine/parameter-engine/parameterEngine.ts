import type { ExperimentConfig, ConfigValue, ParameterDefinition } from '@/types/config'
import type { ExperimentDefinition } from '@/types/experiment'
import { clamp, randomInRange, deepClone } from '@/utils/config'

/** Produce a complete config: every schema param present, defaults filled. */
export function normalizeConfig(
  definition: ExperimentDefinition,
  config?: ExperimentConfig,
): ExperimentConfig {
  const base = deepClone(definition.defaultConfig)
  const out: ExperimentConfig = {}
  for (const p of definition.parameterSchema) {
    const fromSchema = deepClone(p.defaultValue)
    const fromBase = base[p.id] !== undefined ? deepClone(base[p.id]) : undefined
    const override = config?.[p.id] !== undefined ? deepClone(config[p.id]) : undefined
    out[p.id] = override ?? fromBase ?? fromSchema
  }
  // retain any extra keys not declared in schema
  if (config) {
    for (const [k, v] of Object.entries(config)) {
      if (out[k] === undefined) out[k] = deepClone(v)
    }
  }
  return out
}

/** Generate a random-but-valid config from the schema. */
export function randomizeConfig(definition: ExperimentDefinition): ExperimentConfig {
  const out: ExperimentConfig = {}
  for (const p of definition.parameterSchema) {
    out[p.id] = randomForParam(p)
  }
  return out
}

function randomForParam(p: ParameterDefinition): ConfigValue {
  switch (p.type) {
    case 'number':
    case 'range': {
      const min = p.min ?? 0
      const max = p.max ?? 1
      const step = p.step ?? (Math.abs(max - min) > 10 ? 1 : 0.01)
      return randomInRange(min, max, step)
    }
    case 'boolean':
      return Math.random() > 0.5
    case 'color': {
      const hue = Math.floor(Math.random() * 360)
      return `hsl(${hue} 80% 60%)`
    }
    case 'select': {
      const opts = p.options ?? []
      return opts.length ? opts[Math.floor(Math.random() * opts.length)].value : p.defaultValue
    }
    case 'vector2': {
      const min = p.min ?? 0
      const max = p.max ?? 1
      return { x: randomInRange(min, max, 0.01), y: randomInRange(min, max, 0.01) }
    }
    case 'vector3': {
      const min = p.min ?? 0
      const max = p.max ?? 1
      return {
        x: randomInRange(min, max, 0.01),
        y: randomInRange(min, max, 0.01),
        z: randomInRange(min, max, 0.01),
      }
    }
    case 'string':
    default:
      return deepClone(p.defaultValue)
  }
}

/** Apply a preset's partial config over a base config. */
export function applyPreset(
  base: ExperimentConfig,
  presetConfig: ExperimentConfig,
): ExperimentConfig {
  const out = deepClone(base)
  for (const [k, v] of Object.entries(presetConfig)) {
    out[k] = deepClone(v)
  }
  return out
}

/** Clamp a numeric value against the schema definition. */
export function sanitizeValue(p: ParameterDefinition, value: ConfigValue): ConfigValue {
  if ((p.type === 'number' || p.type === 'range') && typeof value === 'number') {
    if (p.min !== undefined) value = Math.max(p.min, value)
    if (p.max !== undefined) value = Math.min(p.max, value)
  }
  return value
}

export { clamp }
