import { EntityRegistry, evalRoleCheck } from "@iraf/core"
import { remult } from "remult"
import type { IAiToolDef } from "./types.js"

export const getSchemaTool: IAiToolDef = {
  name: "get_schema",
  description: "取得可用的 entity 列表和欄位資訊。不帶參數時列出所有 entity；帶 entityKey 時顯示該 entity 的完整 schema。",
  inputSchema: {
    type: "object",
    properties: {
      entityKey: { type: "string", description: "Entity key (optional). Omit to list all entities." },
    },
  },
  async execute(input) {
    const user = remult.user

    if (!input.entityKey) {
      // List all accessible entities
      const allWithMeta = EntityRegistry.getAllWithMeta()
        .filter(({ meta }) => evalRoleCheck(meta.allowedRoles?.read, user))
        .map(({ meta }) => ({ key: meta.key, caption: meta.caption, icon: meta.icon }))
      return JSON.stringify(allWithMeta, null, 2)
    }

    const entityClass = EntityRegistry.getByKey(input.entityKey)
    if (!entityClass) return JSON.stringify({ error: `Entity '${input.entityKey}' not found` })

    const meta = EntityRegistry.getMeta(entityClass)
    if (!meta) return JSON.stringify({ error: "No metadata" })

    const fields = EntityRegistry.getFieldMeta(entityClass)
    const fieldList = Object.entries(fields)
      .filter(([, f]) => !f.auditField)
      .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))
      .map(([name, f]) => ({
        name,
        type: f._type ?? "string",
        caption: f.caption,
        required: f.required ?? false,
        options: f.options,
        ref: f.ref,
        hidden: typeof f.hidden === "boolean" ? f.hidden : false,
      }))

    const actions = EntityRegistry.getActions(entityClass).map(({ meta: am }) => ({
      methodName: am.methodName,
      caption: am.caption,
      allowedRoles: am.allowedRoles,
    }))

    return JSON.stringify({ key: meta.key, caption: meta.caption, fields: fieldList, actions }, null, 2)
  },
}
