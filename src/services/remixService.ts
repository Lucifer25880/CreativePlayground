import { storageService } from './storageService'
import { uid, nowIso } from '@/utils/id'
import { deepClone } from '@/utils/config'
import type { ExperimentConfig } from '@/types/config'
import type { Remix, RemixVersion } from '@/types/remix'

const COL = 'remix'
const VER = 'remixVersion'

export const remixService = {
  list(): Remix[] {
    return storageService.list<Remix>(COL, (a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  get(id: string): Remix | null {
    return storageService.get<Remix>(COL, id)
  },

  create(input: {
    title: string
    description?: string
    sourceExperimentId: string
    sourceWorkId?: string
    config: ExperimentConfig
    thumbnail?: string
  }): Remix {
    const now = nowIso()
    const remix: Remix = {
      id: uid('remix'),
      title: input.title,
      description: input.description ?? '',
      sourceExperimentId: input.sourceExperimentId,
      sourceWorkId: input.sourceWorkId,
      config: deepClone(input.config),
      thumbnail: input.thumbnail,
      currentVersion: 1,
      createdAt: now,
      updatedAt: now,
    }
    storageService.set(COL, remix.id, remix)
    this.addVersion(remix.id, remix.config, 'Initial version')
    return remix
  },

  update(id: string, patch: Partial<Remix>): Remix | null {
    const remix = this.get(id)
    if (!remix) return null
    const next = { ...remix, ...patch, id, updatedAt: nowIso() }
    storageService.set(COL, id, next)
    return next
  },

  saveVersion(id: string, config: ExperimentConfig, description?: string): Remix | null {
    const remix = this.get(id)
    if (!remix) return null
    const versions = this.versions(id)
    const next = { ...remix, config: deepClone(config), currentVersion: versions.length + 1, updatedAt: nowIso() }
    storageService.set(COL, id, next)
    this.addVersion(id, next.config, description ?? `Version ${next.currentVersion}`)
    return next
  },

  remove(id: string): void {
    storageService.remove(COL, id)
    this.versions(id).forEach((v) => storageService.remove(VER, v.id))
  },

  /* versions */
  addVersion(remixId: string, config: ExperimentConfig, description?: string): RemixVersion {
    const versions = this.versions(remixId)
    const v: RemixVersion = {
      id: uid('rv'),
      remixId,
      versionNumber: versions.length + 1,
      configSnapshot: deepClone(config),
      description,
      createdAt: nowIso(),
    }
    storageService.set(VER, v.id, v)
    return v
  },

  versions(remixId: string): RemixVersion[] {
    return storageService
      .list<RemixVersion>(VER)
      .filter((v) => v.remixId === remixId)
      .sort((a, b) => a.versionNumber - b.versionNumber)
  },

  restoreVersion(remixId: string, versionId: string): Remix | null {
    const v = storageService.get<RemixVersion>(VER, versionId)
    const remix = this.get(remixId)
    if (!v || !remix) return null
    const next = { ...remix, config: deepClone(v.configSnapshot), updatedAt: nowIso() }
    storageService.set(COL, remixId, next)
    return next
  },
}
