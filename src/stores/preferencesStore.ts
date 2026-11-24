import { create } from 'zustand'
import { storageService } from '@/services/storageService'

export type QualityLevel = 'low' | 'medium' | 'high'

export interface Preferences {
  theme: 'dark'
  reduceMotion: boolean
  quality: QualityLevel
  favoriteExperiments: string[]
}

const PREF_KEY = 'pref'
const PREF_ID = 'main'

const DEFAULTS: Preferences = {
  theme: 'dark',
  reduceMotion: false,
  quality: 'high',
  favoriteExperiments: [],
}

function load(): Preferences {
  const saved = storageService.get<Partial<Preferences>>(PREF_KEY, PREF_ID)
  return { ...DEFAULTS, ...saved }
}

interface PreferencesState extends Preferences {
  toggleReduceMotion: () => void
  setQuality: (q: QualityLevel) => void
  toggleFavoriteExperiment: (id: string) => void
  isFavoriteExperiment: (id: string) => boolean
  reset: () => void
}

function persist(state: Preferences): void {
  storageService.set(PREF_KEY, PREF_ID, state)
}

export const usePreferencesStore = create<PreferencesState>((set, get) => {
  const initial = load()
  return {
    ...initial,
    toggleReduceMotion: () => {
      const next = { ...get(), reduceMotion: !get().reduceMotion }
      persist(next)
      set(next)
    },
    setQuality: (q) => {
      const next = { ...get(), quality: q }
      persist(next)
      set(next)
    },
    toggleFavoriteExperiment: (id) => {
      const favs = get().favoriteExperiments
      const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id]
      const state = { ...get(), favoriteExperiments: next }
      persist(state)
      set(state)
    },
    isFavoriteExperiment: (id) => get().favoriteExperiments.includes(id),
    reset: () => {
      persist(DEFAULTS)
      set(DEFAULTS)
    },
  }
})
