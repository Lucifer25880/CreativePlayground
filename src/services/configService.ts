import { storageService } from './storageService'
import { uid, nowIso } from '@/utils/id'
import type { ExperimentConfig } from '@/types/config'
import type { ExperimentConfigRecord } from '@/types/experiment'

const COL = 'savedConfig'

export const configService = {
  list(): ExperimentConfigRecord[] {
    return storageService.list<ExperimentConfigRecord>(COL, (a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    )
  },

  get(id: string): ExperimentConfigRecord | null {
    return storageService.get<ExperimentConfigRecord>(COL, id)
  },

  save(experimentId: string, config: ExperimentConfig, name?: string): ExperimentConfigRecord {
    const existing = this.list().find((c) => c.experimentId === experimentId)
    const now = nowIso()
    const record: ExperimentConfigRecord = {
      id: existing?.id ?? uid('cfg'),
      experimentId,
      name,
      config,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    storageService.set(COL, record.id, record)
    return record
  },

  remove(id: string): void {
    storageService.remove(COL, id)
  },

  getForExperiment(experimentId: string): ExperimentConfigRecord | null {
    return this.list().find((c) => c.experimentId === experimentId) ?? null
  },
}
