import { create } from 'zustand'
import { remixService } from '@/services/remixService'
import type { Remix } from '@/types/remix'

interface RemixState {
  remixes: Remix[]
  refresh: () => void
}

export const useRemixStore = create<RemixState>((set) => ({
  remixes: remixService.list(),
  refresh: () => set({ remixes: remixService.list() }),
}))
