import { storageService } from './storageService'
import { uid, nowIso } from '@/utils/id'
import type { ExperimentConfig } from '@/types/config'
import type { Work, WorkSourceType } from '@/types/work'

const COL = 'work'

export const workService = {
  list(): Work[] {
    return storageService.list<Work>(COL, (a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  get(id: string): Work | null {
    return storageService.get<Work>(COL, id)
  },

  create(input: {
    title: string
    description?: string
    sourceType: WorkSourceType
    sourceExperimentId?: string
    sourceRemixId?: string
    config: ExperimentConfig
    tags?: string[]
    thumbnail?: string
  }): Work {
    const now = nowIso()
    const work: Work = {
      id: uid('work'),
      title: input.title,
      description: input.description ?? '',
      sourceType: input.sourceType,
      sourceExperimentId: input.sourceExperimentId,
      sourceRemixId: input.sourceRemixId,
      config: input.config,
      promptIds: [],
      tags: input.tags ?? [],
      thumbnail: input.thumbnail,
      favorite: false,
      createdAt: now,
      updatedAt: now,
    }
    storageService.set(COL, work.id, work)
    return work
  },

  update(id: string, patch: Partial<Work>): Work | null {
    const work = this.get(id)
    if (!work) return null
    const next = { ...work, ...patch, id, updatedAt: nowIso() }
    storageService.set(COL, id, next)
    return next
  },

  toggleFavorite(id: string): Work | null {
    const w = this.get(id)
    if (!w) return null
    return this.update(id, { favorite: !w.favorite })
  },

  remove(id: string): void {
    storageService.remove(COL, id)
  },

  attachPrompt(workId: string, promptId: string): Work | null {
    const w = this.get(workId)
    if (!w) return null
    if (w.promptIds.includes(promptId)) return w
    return this.update(workId, { promptIds: [...w.promptIds, promptId] })
  },

  detachPrompt(workId: string, promptId: string): Work | null {
    const w = this.get(workId)
    if (!w) return null
    return this.update(workId, { promptIds: w.promptIds.filter((p) => p !== promptId) })
  },
}
