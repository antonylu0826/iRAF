import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import { resolveRefLabelField } from "./refLabel"

type CacheEntry = { label: string; ts: number }
type LabelMap = Map<string, CacheEntry>

const cache = new Map<string, LabelMap>()
let ttlMs = 5 * 60 * 1000 // 5 minutes

export function setRefLabelCacheTTL(ms: number) {
  ttlMs = Math.max(0, ms)
}

export function clearRefLabelCache() {
  cache.clear()
}

export function getRefLabelCacheStats() {
  let buckets = 0
  let entries = 0
  for (const map of cache.values()) {
    buckets += 1
    entries += map.size
  }
  return { buckets, entries, ttlMs }
}

function cacheKey(entityClass: Function, labelField: string): string {
  const meta = EntityRegistry.getMeta(entityClass)
  return `${meta?.key ?? entityClass.name}:${labelField}`
}

function getLabelMap(entityClass: Function, labelField: string): LabelMap {
  const key = cacheKey(entityClass, labelField)
  let map = cache.get(key)
  if (!map) {
    map = new Map()
    cache.set(key, map)
  }
  return map
}

function isFresh(entry: CacheEntry | undefined): entry is CacheEntry {
  if (!entry) return false
  if (ttlMs === 0) return false
  return Date.now() - entry.ts <= ttlMs
}

export async function prefetchLabels(
  entityClass: Function,
  ids: Array<string | number>,
  explicitLabelField?: string
): Promise<Record<string, string>> {
  const labelField = resolveRefLabelField(entityClass, explicitLabelField)
  const map = getLabelMap(entityClass, labelField)

  const uniqueIds = [...new Set(ids.map((id) => String(id)).filter(Boolean))]
  const missing = uniqueIds.filter((id) => !isFresh(map.get(id)))

  if (missing.length > 0) {
    try {
      const records: any[] = await remult.repo(entityClass as any).find({
        where: { id: { $in: missing } } as any,
        limit: missing.length,
      })
      const now = Date.now()
      for (const rec of records) {
        const id = String(rec.id)
        map.set(id, { label: String(rec[labelField] ?? rec.id), ts: now })
      }
    } catch {
      // ignore fetch errors; return best-effort cache
    }
  }

  const result: Record<string, string> = {}
  for (const id of uniqueIds) {
    const entry = map.get(id)
    if (isFresh(entry)) result[id] = entry.label
  }
  return result
}

export async function resolveLabel(
  entityClass: Function,
  id: string | number,
  explicitLabelField?: string
): Promise<string> {
  const labelField = resolveRefLabelField(entityClass, explicitLabelField)
  const map = getLabelMap(entityClass, labelField)
  const key = String(id)
  const cached = map.get(key)
  if (isFresh(cached)) return cached.label

  try {
    const record: any = await remult.repo(entityClass as any).findId(id as any)
    const label = record ? String(record[labelField] ?? record.id) : key
    map.set(key, { label, ts: Date.now() })
    return label
  } catch {
    return key
  }
}
