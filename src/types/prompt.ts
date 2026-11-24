import type { ExperimentConfig } from './config'

export type PromptGenerationMode =
  | 'full'
  | 'from-config'
  | 'enhance'
  | 'directed'

export type TargetTool = 'codex' | 'claude-code' | 'cursor' | 'gemini' | 'generic'

export interface Prompt {
  id: string
  title: string
  description: string
  category: string
  content: string
  sourceExperimentId?: string
  sourceWorkId?: string
  generationMode: PromptGenerationMode
  targetTool: TargetTool
  tags: string[]
  favorite: boolean
  currentVersion: number
  createdAt: string
  updatedAt: string
}

export interface PromptVersion {
  id: string
  promptId: string
  versionNumber: number
  content: string
  generationMode: PromptGenerationMode
  userInstruction?: string
  sourceConfigSnapshot?: ExperimentConfig
  createdAt: string
}

export interface PromptGeneratorOptions {
  targetTool: TargetTool
  techStack: string[]
  visualStyle: string
  developmentComplexity: 'simple' | 'moderate' | 'advanced'
  interactionComplexity: 'simple' | 'moderate' | 'advanced'
  responsive: boolean
  performance: 'basic' | 'balanced' | 'optimized'
  includeProjectStructure: boolean
  includeRunInstructions: boolean
  includeAcceptanceCriteria: boolean
}
