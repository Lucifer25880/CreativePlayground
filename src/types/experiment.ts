import type {
  ExperimentConfig,
  ParameterSchema,
  PresetConfig,
  InteractionSchema,
  AnimationSchema,
  RendererType,
} from './config'

export type ExperimentCategoryId =
  | '3d'
  | 'scroll'
  | 'mouse'
  | 'visual'
  | 'functional'
  | 'dataviz'
  | 'ui'

export interface ExperimentCategory {
  id: ExperimentCategoryId
  name: string
  description: string
  icon: string
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface ExperimentDefinition {
  id: string
  name: string
  description: string
  longDescription?: string
  category: ExperimentCategoryId
  tags: string[]
  difficulty: Difficulty
  rendererType: RendererType
  version: string
  defaultConfig: ExperimentConfig
  parameterSchema: ParameterSchema
  presets: PresetConfig[]
  interactionSchema: InteractionSchema
  animationSchema: AnimationSchema
  promptTemplate?: string
  createdAt: string
  updatedAt: string
}

export interface ExperimentConfigRecord {
  id: string
  experimentId: string
  name?: string
  config: ExperimentConfig
  createdAt: string
  updatedAt: string
}
