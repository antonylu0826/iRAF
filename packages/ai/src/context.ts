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
    `- **Dashboard widget 操作限制**：新增或修改 widget 必須在特定 Dashboard 的檢視頁（currentView=dashboard 且有 currentRecordId）。若使用者要求 widget 相關操作但目前不在該頁面，請告知使用者先前往目標 Dashboard 頁面，例如：「請先切換到您要編輯的 Dashboard 頁面，我才能幫您新增 widget」，並說明可從左側選單進入。不要在非 dashboard 頁面嘗試執行 widget 操作。`,
  ]

  // Dashboard-specific guidance when user is on a dashboard page
  if (ctx.currentView === "dashboard" || (ctx.currentModule === "dashboards" && ctx.currentEntity === "dashboards")) {
    parts.push(
      ``,
      `## Dashboard 助手模式`,
      ctx.currentRecordId
        ? [
            `使用者正在檢視 Dashboard (ID: ${ctx.currentRecordId})。`,
            `你可以：`,
            `1. 用 query_records (entityKey: "dashboard-widgets", where: {"dashboardId": "${ctx.currentRecordId}"}) 查看現有 widget`,
            `2. 用 generate_widget_config 分析 entity schema 並產生 widget 配置建議`,
            `3. 用 create_record (entityKey: "dashboard-widgets") 新增 widget（需使用者確認）`,
            `4. 用 update_record 修改現有 widget 的 dataSource 或 config`,
          ].join("\n")
        : `使用者在 Dashboard 列表頁。可以用 create_record (entityKey: "dashboards") 建立新 Dashboard。`,
      ``,
      `### Widget 建立流程`,
      `1. 先用 generate_widget_config 取得 entity schema 並產生建議配置`,
      `2. 向使用者說明建議的 widget 配置`,
      `3. 用 create_record (entityKey: "dashboard-widgets") 建立，系統會要求使用者確認`,
      ``,
      `### Widget 類型`,
      `- kpi-card: KPI 指標卡片。dataSource.aggregate: {field, function: count|sum|avg|min|max}。config: {format: number|currency|percent, color: blue|green|red|orange|purple, prefix, suffix}`,
      `- bar-chart: 長條圖。dataSource.aggregate 需含 groupBy。config: {xField: "group", yField: "value", orientation: vertical|horizontal}`,
      `- line-chart: 折線圖。dataSource.aggregate 需含 groupBy。config: {xField: "group", yField: "value"}`,
      `- pie-chart: 圓餅圖。dataSource.aggregate 需含 groupBy。config: {nameField: "group", valueField: "value"}`,
      `- data-table: 資料表格。不需 aggregate，直接回傳記錄陣列。config: {columns: ["field1","field2"], pageSize: 10}`,
      `- markdown: Markdown 文字。dataSource: {type: "static", data: "markdown 內容"}`,
      ``,
      `### Grid 佈局 (12 欄系統)`,
      `- gridX: 起始欄 (0-11), gridY: 起始列, gridW: 寬度欄數, gridH: 高度列數`,
      `- KPI 建議 gridW:3 gridH:2，圖表建議 gridW:6 gridH:3，表格建議 gridW:8 gridH:4`,
      `- 必填欄位: dashboardId, widgetType, gridX, gridY, gridW, gridH, dataSource, config`,
    )
  }

  if (customSystemPrompt) {
    parts.push("", "## 附加指引", customSystemPrompt)
  }

  return parts.filter(Boolean).join("\n")
}
