import { remult } from "remult"
import { EntityRegistry } from "@iraf/core"
import type { IAiToolDef } from "./types.js"

export const callActionTool: IAiToolDef = {
  name: "call_action",
  description: "呼叫業務動作（@iAction），例如更改狀態、觸發流程。",
  requiresConfirmation: true,
  inputSchema: {
    type: "object",
    properties: {
      entityKey: { type: "string", description: "Entity key, e.g. 'feature-gallery'" },
      actionName: { type: "string", description: "Action method name, e.g. 'incrementCount'" },
      recordId: { type: "string", description: "Target record ID" },
    },
    required: ["entityKey", "actionName", "recordId"],
  },
  async execute(input) {
    const entityClass = EntityRegistry.getByKey(input.entityKey)
    if (!entityClass) return JSON.stringify({ error: `Entity '${input.entityKey}' not found` })

    const actions = EntityRegistry.getActions(entityClass)
    const action = actions.find(a => a.meta.methodName === input.actionName)
    if (!action) return JSON.stringify({ error: `Action '${input.actionName}' not found` })

    const ctrl = action.controllerClass as any
    const method = ctrl[input.actionName]
    if (typeof method !== "function") return JSON.stringify({ error: `Method '${input.actionName}' not callable` })

    try {
      const result = await method(input.recordId)
      return result != null ? JSON.stringify(result) : `Action '${input.actionName}' completed.`
    } catch (err: any) {
      return JSON.stringify({ error: err.message })
    }
  },
}
