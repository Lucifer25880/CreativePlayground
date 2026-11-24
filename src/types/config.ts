/**
 * Unified value types shared by the parameter engine, experiments and stores.
 */

export type ScalarConfigValue = number | boolean | string

export interface Vector2Value {
  x: number
  y: number
}

export interface Vector3Value {
  x: number
  y: number
  z: number
}

export type ConfigValue =
  | ScalarConfigValue
  | Vector2Value
  | Vector3Value
  | ConfigValue[]
  | { [key: string]: ConfigValue }

export type ExperimentConfig = Record<string, ConfigValue>

export type ParamType =
  | 'number'
  | 'boolean'
  | 'string'
  | 'color'
  | 'select'
  | 'vector2'
  | 'vector3'
  | 'range'
  | 'object'
  | 'array'

export interface SelectOption {
  label: string
  value: string | number
}

export interface ParameterDefinition {
  id: string
  label: string
  type: ParamType
  group?: string
  description?: string
  /** number / range */
  min?: number
  max?: number
  step?: number
  unit?: string
  /** select */
  options?: SelectOption[]
  /** defaults used when a config value is missing */
  defaultValue: ConfigValue
  /** marks this as an advanced / perf-sensitive knob */
  advanced?: boolean
}

export type ParameterSchema = ParameterDefinition[]

export interface PresetConfig {
  id: string
  name: string
  description?: string
  config: ExperimentConfig
}

export interface InteractionSchema {
  mouse?: boolean
  scroll?: boolean
  drag?: boolean
  hover?: boolean
  keyboard?: boolean
  touch?: boolean
  description?: string
}

export interface AnimationSchema {
  enabled?: boolean
  loop?: boolean
  fps?: number
  description?: string
}

export type RendererType = 'three' | 'canvas2d' | 'dom' | 'webgl' | 'mixed'
