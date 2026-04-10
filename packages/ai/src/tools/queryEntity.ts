import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import type { IAiToolDef } from "./types.js"

export const queryEntityTool: IAiToolDef = {
  name: "query_records",
  description: "查詢指定 entity 的記錄，支援篩選和排序。回傳結果包含 total（符合條件的總筆數），當 hasMore=true 代表還有更多筆未回傳。先用 get_schema 了解可用的 entity 和欄位。",
  inputSchema: {
    type: "object",
    properties: {
      entityKey: { type: "string", description: "Entity key, e.g. 'master-items'. Use get_schema to discover available entities." },
      where: { type: "object", description: "Remult-style filter object, e.g. {\"status\": \"active\"} or {\"amount\": {\"$gt\": 100}}" },
      orderBy: { type: "object", description: "Sort order, e.g. {\"createdAt\": \"desc\"}" },
      limit: { type: "number", description: "Max records to return (default 20, max 100)" },
    },
    required: ["entityKey"],
  },
  async execute(input) {
    const entityClass = EntityRegistry.getByKey(input.entityKey)
    if (!entityClass) return JSON.stringify({ error: `Entity '${input.entityKey}' not found` })

    const repo = remult.repo(entityClass as any)
    const limit = Math.min(input.limit ?? 20, 100)

    const [records, total] = await Promise.all([
      repo.find({
        where: input.where,
        orderBy: input.orderBy,
        limit,
      }),
      repo.count(input.where ?? {}),
    ])

    return JSON.stringify({
      total,
      returned: records.length,
      hasMore: total > records.length,
      records,
    }, null, 2)
  },
}
