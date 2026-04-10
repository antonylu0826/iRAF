import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import type { IAiToolDef } from "./types.js"

export const updateRecordTool: IAiToolDef = {
  name: "update_record",
  description: "更新既有記錄。只需提供要修改的欄位。",
  requiresConfirmation: true,
  getAffectedEntityKey: (input) => input.entityKey,
  inputSchema: {
    type: "object",
    properties: {
      entityKey: { type: "string", description: "Entity key, e.g. 'master-items'" },
      id: { type: "string", description: "Record ID" },
      data: { type: "object", description: "Fields to update, e.g. {\"name\": \"Updated Name\"}" },
    },
    required: ["entityKey", "id", "data"],
  },
  async execute(input) {
    const entityClass = EntityRegistry.getByKey(input.entityKey)
    if (!entityClass) return JSON.stringify({ error: `Entity '${input.entityKey}' not found` })

    try {
      const repo = remult.repo(entityClass as any)
      const record = await repo.findId(input.id)
      if (!record) return JSON.stringify({ error: `Record '${input.id}' not found` })

      Object.assign(record, input.data)
      const updated = await repo.save(record)
      return JSON.stringify(updated, null, 2)
    } catch (err: any) {
      return JSON.stringify({ error: err.message })
    }
  },
}
