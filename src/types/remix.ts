import type { ExperimentConfig } from './config'

export interface Remix {
  id: string
  title: string
  description: string
  sourceExperimentId: string
  sourceWorkId?: string
  config: ExperimentConfig
  thumbnail?: string
  currentVersion: number
  createdAt: string
  updatedAt: string
}

export interface RemixVersion {
  id: string
  remixId: string
  versionNumber: number
  configSnapshot: ExperimentConfig
  description?: string
  createdAt: string
}
