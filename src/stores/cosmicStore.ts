import { create } from 'zustand'

export type CosmicPhase = 'idle' | 'exploding' | 'exploded' | 'rewinding'

/** Shared mutable progress (0 = assembled, 1 = fully exploded), read per-frame without re-rendering. */
export interface ExplosionState {
  progress: number
}

interface CosmicState {
  phase: CosmicPhase
  setPhase: (p: CosmicPhase) => void
  explode: () => void
  rewind: () => void
}

export const useCosmicStore = create<CosmicState>((set, get) => ({
  phase: 'idle',
  setPhase: (p) => set({ phase: p }),
  explode: () => {
    if (get().phase === 'idle') set({ phase: 'exploding' })
  },
  rewind: () => {
    if (get().phase === 'exploded') set({ phase: 'rewinding' })
  },
}))
