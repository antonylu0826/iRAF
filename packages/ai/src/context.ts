import { EntityRegistry, evalRoleCheck } from "@iraf/core"
import type { IAiContext, IUserContext } from "@iraf/core"

export function buildSystemPrompt(
  user: IUserContext,
  ctx: IAiContext,
  customSystemPrompt?: string,
): string {
  const allWithMeta = EntityRegistry.getAllWithMeta()
  const readable = allWithMeta.filter(
    ({ meta }) => evalRoleCheck(meta.allowedRoles?.read, user),
  )

  const entityDescriptions = readable.map(({ entityClass, meta }) => {
    const fields = EntityRegistry.getFieldMeta(entityClass)
    const fieldList = Object.entries(fields)
      .filter(([, f]) => !f.hidden && !f.auditField)
      .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))
      .map(([name, f]) => `${name}(${f._type ?? "string"})`)
      .join(", ")
    return `- ${meta.key} (${meta.caption}): ${fieldList}`
  }).join("\n")

  const actions = readable.flatMap(({ entityClass, meta }) => {
    return EntityRegistry.getActions(entityClass)
      .filter(({ meta: am }) => !am.allowedRoles || am.allowedRoles.some(r => (user.roles ?? []).includes(r)))
      .map(({ meta: am }) => `- ${meta.key}: ${am.methodName} — ${am.caption}`)
  })

  const parts = [
    `你是 iRAF 系統的 AI 助手。`,
    ``,
    `## 目前使用者`,
    `- 名稱：${user.name ?? "Unknown"}`,
    `- 角色：${(user.roles ?? []).join(", ") || "（無）"}`,
    ``,
    `## 目前頁面`,
    `- 模組：${ctx.currentModule ?? "（無）"}`,
    `- 實體：${ctx.currentEntity ?? "（無）"}`,
    `- 檢視：${ctx.currentView ?? "（無）"}`,
    ctx.currentRecordId ? `- 正在檢視記錄 ID：${ctx.currentRecordId}` : "",
    ``,
    `## 可用的資料表`,
    entityDescriptions || "（無）",
    ``,
    `## 可用的業務動作`,
    actions.length > 0 ? actions.join("\n") : "（無）",
    ``,
    `## 行為準則`,
    `- 回答時使用繁體中文，簡潔明瞭`,
    `- 查詢資料時使用 query_records 工具`,
    `- 如果使用者問的資料你無法存取（權限不足），請明確告知`,
    `- 呈現資料時善用 markdown 表格`,
    `- 不要猜測資料內容，一律透過工具查詢`,
    `- 執行寫入操作前，先說明你要做什麼，讓使用者確認`,
  ]

  if (customSystemPrompt) {
    parts.push("", "## 附加指引", customSystemPrompt)
  }

  return parts.filter(Boolean).join("\n")
}
