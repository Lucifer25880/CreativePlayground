import { create } from 'zustand'
import type { ExperimentConfig } from '@/types/config'

/**
 * Cross-route handoff for the Live Playground.
 * A page (e.g. My Works) seeds a config + experiment id, then navigates to
 * /playground/:id; the Playground page consumes and clears the seed.
 */
interface PlaygroundSeed {
  experimentId: string
  config: ExperimentConfig
  presetId?: string | null
}

interface PlaygroundState {
  seed: PlaygroundSeed | null
  seedPlayground: (seed: PlaygroundSeed) => void
  consumeSeed: () => PlaygroundSeed | null
}

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
  seed: null,
  seedPlayground: (seed) => set({ seed }),
  consumeSeed: () => {
    const s = get().seed
    set({ seed: null })
    return s
  },
}))
