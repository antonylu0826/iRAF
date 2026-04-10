import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import type { IAiToolDef } from "./types.js"

export const queryEntityTool: IAiToolDef = {
  name: "query_records",
  description: "查詢指定 entity 的記錄，支援篩選和排序。先用 get_schema 了解可用的 entity 和欄位。",
  inputSchema: {
    type: "object",
    properties: {
      entityKey: { type: "string", description: "Entity key, e.g. 'master-items'. Use get_schema to discover available entities." },
      where: { type: "object", description: "Remult-style filter object, e.g. {\"status\": \"active\"} or {\"amount\": {\"$gt\": 100}}" },
      orderBy: { type: "object", description: "Sort order, e.g. {\"createdAt\": \"desc\"}" },
      limit: { type: "number", description: "Max records to return (default 10, max 50)" },
    },
    required: ["entityKey"],
  },
  async execute(input) {
    const entityClass = EntityRegistry.getByKey(input.entityKey)
    if (!entityClass) return JSON.stringify({ error: `Entity '${input.entityKey}' not found` })

    const repo = remult.repo(entityClass as any)
    const records = await repo.find({
      where: input.where,
      orderBy: input.orderBy,
      limit: Math.min(input.limit ?? 10, 50),
    })
    return JSON.stringify(records, null, 2)
  },
}
