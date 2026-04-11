import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import type { IWidgetDataSource, IWidgetAggregate } from "@iraf/dashboard"

/**
 * Resolve widget data from its dataSource configuration.
 * Runs on the frontend — uses remult.repo for entity queries.
 */
export async function resolveWidgetData(ds: IWidgetDataSource): Promise<any> {
  switch (ds.type) {
    case "static":
      return ds.data ?? null

    case "entity": {
      if (!ds.entityKey) return null
      const entityClass = EntityRegistry.getByKey(ds.entityKey)
      if (!entityClass) return { error: `Entity '${ds.entityKey}' not found` }

      const repo = remult.repo(entityClass as any)
      const records = await repo.find({
        where: ds.where,
        orderBy: ds.orderBy,
        limit: ds.limit ?? 1000,
      })

      if (ds.aggregate) {
        return computeAggregate(records, ds.aggregate)
      }
      return records
    }

    case "api": {
      if (!ds.url) return null
      const token = localStorage.getItem("iraf_token")
      const headers: Record<string, string> = {}
      if (token) headers["Authorization"] = `Bearer ${token}`
      if (ds.body) headers["Content-Type"] = "application/json"

      const res = await fetch(ds.url, {
        method: ds.method ?? "GET",
        headers,
        body: ds.body ? JSON.stringify(ds.body) : undefined,
      })
      return res.json()
    }

    default:
      return null
  }
}

/**
 * Compute aggregate on a set of records (frontend-side).
 */
export function computeAggregate(
  records: Record<string, any>[],
  agg: IWidgetAggregate,
): any {
  if (agg.groupBy) {
    return computeGroupedAggregate(records, agg)
  }
  return computeSingleAggregate(records, agg)
}

function computeSingleAggregate(
  records: Record<string, any>[],
  agg: IWidgetAggregate,
): number {
  const values = records.map(r => Number(r[agg.field] ?? 0)).filter(v => !isNaN(v))

  switch (agg.function) {
    case "count":
      return records.length
    case "sum":
      return values.reduce((a, b) => a + b, 0)
    case "avg":
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    case "min":
      return values.length > 0 ? Math.min(...values) : 0
    case "max":
      return values.length > 0 ? Math.max(...values) : 0
    default:
      return 0
  }
}

function computeGroupedAggregate(
  records: Record<string, any>[],
  agg: IWidgetAggregate,
): Array<{ group: string; value: number }> {
  const groups = new Map<string, Record<string, any>[]>()

  for (const r of records) {
    const key = String(r[agg.groupBy!] ?? "other")
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }

  return Array.from(groups.entries()).map(([group, rows]) => ({
    group,
    value: computeSingleAggregate(rows, agg),
  }))
}
