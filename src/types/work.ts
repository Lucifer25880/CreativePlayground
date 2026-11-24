import type { ExperimentConfig } from './config'

export type WorkSourceType = 'experiment' | 'remix' | 'composition' | 'custom'

export interface Work {
  id: string
  title: string
  description: string
  sourceType: WorkSourceType
  sourceExperimentId?: string
  sourceRemixId?: string
  config: ExperimentConfig
  promptIds: string[]
  thumbnail?: string
  tags: string[]
  favorite: boolean
  createdAt: string
  updatedAt: string
}
