import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import type { IAiToolDef } from "./types.js"

export const createRecordTool: IAiToolDef = {
  name: "create_record",
  description: "建立新記錄。需要 entity key 和欄位資料。",
  requiresConfirmation: true,
  getAffectedEntityKey: (input) => input.entityKey,
  inputSchema: {
    type: "object",
    properties: {
      entityKey: { type: "string", description: "Entity key, e.g. 'master-items'" },
      data: { type: "object", description: "Field values, e.g. {\"name\": \"New Item\", \"quantity\": 10}" },
    },
    required: ["entityKey", "data"],
  },
  async execute(input) {
    const entityClass = EntityRegistry.getByKey(input.entityKey)
    if (!entityClass) return JSON.stringify({ error: `Entity '${input.entityKey}' not found` })

    try {
      const repo = remult.repo(entityClass as any)
      const created = await repo.insert(input.data)
      return JSON.stringify(created, null, 2)
    } catch (err: any) {
      return JSON.stringify({ error: err.message })
    }
  },
}
