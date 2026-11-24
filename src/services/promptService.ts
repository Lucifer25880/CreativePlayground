import { storageService } from './storageService'
import { uid, nowIso } from '@/utils/id'
import type { ExperimentConfig } from '@/types/config'
import type {
  Prompt,
  PromptVersion,
  PromptGenerationMode,
  TargetTool,
} from '@/types/prompt'

const COL = 'prompt'
const VER = 'promptVersion'

export const promptService = {
  list(): Prompt[] {
    return storageService.list<Prompt>(COL, (a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  get(id: string): Prompt | null {
    return storageService.get<Prompt>(COL, id)
  },

  create(input: {
    title: string
    description?: string
    category: string
    content: string
    sourceExperimentId?: string
    sourceWorkId?: string
    generationMode: PromptGenerationMode
    targetTool: TargetTool
    tags?: string[]
    userInstruction?: string
    sourceConfigSnapshot?: ExperimentConfig
  }): Prompt {
    const now = nowIso()
    const prompt: Prompt = {
      id: uid('prompt'),
      title: input.title,
      description: input.description ?? '',
      category: input.category,
      content: input.content,
      sourceExperimentId: input.sourceExperimentId,
      sourceWorkId: input.sourceWorkId,
      generationMode: input.generationMode,
      targetTool: input.targetTool,
      tags: input.tags ?? [],
      favorite: false,
      currentVersion: 1,
      createdAt: now,
      updatedAt: now,
    }
    storageService.set(COL, prompt.id, prompt)
    this.addVersion(prompt.id, {
      content: input.content,
      generationMode: input.generationMode,
      userInstruction: input.userInstruction,
      sourceConfigSnapshot: input.sourceConfigSnapshot,
    })
    return prompt
  },

  update(id: string, patch: Partial<Prompt>): Prompt | null {
    const prompt = this.get(id)
    if (!prompt) return null
    const next = { ...prompt, ...patch, id, updatedAt: nowIso() }
    storageService.set(COL, id, next)
    return next
  },

  toggleFavorite(id: string): Prompt | null {
    const p = this.get(id)
    if (!p) return null
    return this.update(id, { favorite: !p.favorite })
  },

  saveNewVersion(
    id: string,
    input: {
      content: string
      generationMode: PromptGenerationMode
      userInstruction?: string
      sourceConfigSnapshot?: ExperimentConfig
    },
  ): Prompt | null {
    const prompt = this.get(id)
    if (!prompt) return null
    const v = this.addVersion(id, input)
    const next = { ...prompt, content: input.content, currentVersion: v.versionNumber, updatedAt: nowIso() }
    storageService.set(COL, id, next)
    return next
  },

  remove(id: string): void {
    storageService.remove(COL, id)
    this.versions(id).forEach((v) => storageService.remove(VER, v.id))
  },

  /* versions */
  addVersion(
    promptId: string,
    input: {
      content: string
      generationMode: PromptGenerationMode
      userInstruction?: string
      sourceConfigSnapshot?: ExperimentConfig
    },
  ): PromptVersion {
    const versions = this.versions(promptId)
    const v: PromptVersion = {
      id: uid('pv'),
      promptId,
      versionNumber: versions.length + 1,
      content: input.content,
      generationMode: input.generationMode,
      userInstruction: input.userInstruction,
      sourceConfigSnapshot: input.sourceConfigSnapshot,
      createdAt: nowIso(),
    }
    storageService.set(VER, v.id, v)
    return v
  },

  versions(promptId: string): PromptVersion[] {
    return storageService
      .list<PromptVersion>(VER)
      .filter((v) => v.promptId === promptId)
      .sort((a, b) => a.versionNumber - b.versionNumber)
  },

  restoreVersion(promptId: string, versionId: string): Prompt | null {
    const v = storageService.get<PromptVersion>(VER, versionId)
    const prompt = this.get(promptId)
    if (!v || !prompt) return null
    const next = { ...prompt, content: v.content, updatedAt: nowIso() }
    storageService.set(COL, promptId, next)
    return next
  },
}
