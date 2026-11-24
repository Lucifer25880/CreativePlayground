/**
 * storageService — the single data-access abstraction used by every feature.
 * No page or store touches localStorage / IndexedDB directly.
 *
 * - JSON metadata (configs, prompts, works, versions) -> localStorage (safe-fallback to memory)
 * - Large blobs (canvas thumbnails, exported payloads)        -> IndexedDB
 */

const NS = 'cp.'

type Json = unknown

/* ------------------------------------------------------------------ */
/* Safe JSON + key helpers                                             */
/* ------------------------------------------------------------------ */

function safeParse<T>(raw: string | null): T | null {
  if (raw == null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function safeStringify(value: Json): string {
  return JSON.stringify(value)
}

function mkKey(collection: string, id: string): string {
  return `${NS}${collection}:${id}`
}

/* ------------------------------------------------------------------ */
/* localStorage backend with in-memory fallback                        */
/* ------------------------------------------------------------------ */

const memory = new Map<string, string>()

function localStorageAvailable(): boolean {
  try {
    const k = `${NS}__probe__`
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

const lsAvailable = typeof window !== 'undefined' && localStorageAvailable()

function lsGet(key: string): string | null {
  if (lsAvailable) return window.localStorage.getItem(key)
  return memory.get(key) ?? null
}

function lsSet(key: string, value: string): void {
  if (lsAvailable) window.localStorage.setItem(key, value)
  memory.set(key, value)
}

function lsRemove(key: string): void {
  if (lsAvailable) window.localStorage.removeItem(key)
  memory.delete(key)
}

function lsKeys(prefix: string): string[] {
  if (lsAvailable) {
    const out: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(prefix)) out.push(k)
    }
    return out
  }
  return [...memory.keys()].filter((k) => k.startsWith(prefix))
}

/* ------------------------------------------------------------------ */
/* IndexedDB backend for large blobs                                   */
/* ------------------------------------------------------------------ */

const DB_NAME = 'creative-playground'
const DB_STORE = 'blobs'

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null)
    try {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DB_STORE, 'readonly')
      const req = tx.objectStore(DB_STORE).get(key)
      req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb()
  if (!db) return
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DB_STORE, 'readwrite')
      tx.objectStore(DB_STORE).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

async function idbRemove(key: string): Promise<void> {
  const db = await openDb()
  if (!db) return
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DB_STORE, 'readwrite')
      tx.objectStore(DB_STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export const storageService = {
  available: lsAvailable,

  /** Read JSON metadata for a single record. */
  get<T>(collection: string, id: string): T | null {
    return safeParse<T>(lsGet(mkKey(collection, id)))
  },

  /** Write JSON metadata for a single record. */
  set<T>(collection: string, id: string, value: T): void {
    lsSet(mkKey(collection, id), safeStringify(value))
  },

  /** Remove a single record. */
  remove(collection: string, id: string): void {
    lsRemove(mkKey(collection, id))
  },

  /** List all record ids for a collection. */
  listIds(collection: string): string[] {
    const prefix = mkKey(collection, '')
    return lsKeys(prefix)
      .map((k) => k.slice(prefix.length))
      .filter((id) => id.length > 0)
  },

  /** Read all records for a collection (sorted by provided comparator). */
  list<T>(collection: string, sortBy?: (a: T, b: T) => number): T[] {
    const out = this.listIds(collection)
      .map((id) => this.get<T>(collection, id))
      .filter((v): v is T => v != null)
    if (sortBy) out.sort(sortBy)
    return out
  },

  /** Persist a large string blob (thumbnail dataURL, export). */
  async putBlob(key: string, value: string): Promise<void> {
    await idbSet(key, value)
  },

  async getBlob(key: string): Promise<string | null> {
    return idbGet(key)
  },

  async removeBlob(key: string): Promise<void> {
    await idbRemove(key)
  },

  /** Best-effort clear of a whole collection. */
  clearCollection(collection: string): void {
    this.listIds(collection).forEach((id) => this.remove(collection, id))
  },
}
