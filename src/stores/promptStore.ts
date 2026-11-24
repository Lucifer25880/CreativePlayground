import { create } from 'zustand'
import { promptService } from '@/services/promptService'
import type { Prompt } from '@/types/prompt'

interface PromptState {
  prompts: Prompt[]
  refresh: () => void
}

export const usePromptStore = create<PromptState>((set) => ({
  prompts: promptService.list(),
  refresh: () => set({ prompts: promptService.list() }),
}))
