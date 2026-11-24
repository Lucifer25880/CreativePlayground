import { create } from 'zustand'
import { workService } from '@/services/workService'
import type { Work } from '@/types/work'

interface WorkState {
  works: Work[]
  refresh: () => void
}

export const useWorkStore = create<WorkState>((set) => ({
  works: workService.list(),
  refresh: () => set({ works: workService.list() }),
}))
