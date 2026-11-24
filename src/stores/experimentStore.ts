import { create } from 'zustand'
import { configService } from '@/services/configService'
import type { ExperimentConfigRecord } from '@/types/experiment'

interface ExperimentState {
  savedConfigs: ExperimentConfigRecord[]
  refresh: () => void
}

export const useExperimentStore = create<ExperimentState>((set) => ({
  savedConfigs: configService.list(),
  refresh: () => set({ savedConfigs: configService.list() }),
}))
