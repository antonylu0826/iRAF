import { EntityRegistry, evalRoleCheck } from "@iraf/core"
import { remult } from "remult"
import type { IAiToolDef } from "./types.js"

export const generateWidgetConfigTool: IAiToolDef = {
  name: "generate_widget_config",
  description:
    "分析可用的 entity schema，根據使用者描述產生適合的 dashboard widget 配置 JSON。" +
    "回傳建議的 widgetType、title、dataSource、config、gridW、gridH。" +
    "此工具不會建立記錄，只回傳建議配置——之後再用 create_record 實際建立。",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "使用者對 widget 的描述，例如 '顯示每月訂單數量的折線圖'",
      },
      dashboardId: {
        type: "string",
        description: "目標 Dashboard ID",
      },
    },
    required: ["description", "dashboardId"],
  },

  requiresConfirmation: false,

  async execute(input) {
    const user = remult.user

    // Collect all entity schemas accessible to the user
    const allWithMeta = EntityRegistry.getAllWithMeta()
      .filter(({ meta }) => evalRoleCheck(meta.allowedRoles?.read, user))

    const entitySchemas = allWithMeta.map(({ entityClass, meta }) => {
      const fields = EntityRegistry.getFieldMeta(entityClass)
      const fieldList = Object.entries(fields)
        .filter(([, f]) => !f.auditField)
        .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999))
        .map(([name, f]) => ({
          name,
          type: f._type ?? "string",
          caption: f.caption,
        }))

      return {
        entityKey: meta.key,
        caption: meta.caption,
        fields: fieldList,
      }
    })

    // Query existing widgets for this dashboard to compute next grid position
    let existingWidgets: any[] = []
    try {
      const WidgetClass = EntityRegistry.getByKey("dashboard-widgets")
      if (WidgetClass) {
        existingWidgets = await remult.repo(WidgetClass as any).find({
          where: { dashboardId: input.dashboardId },
          orderBy: { order: "asc" },
        } as any)
      }
    } catch {
      // ignore — non-fatal
    }

    const nextGridY = existingWidgets.reduce(
      (m: number, w: any) => Math.max(m, (w.gridY ?? 0) + (w.gridH ?? 2)),
      0,
    )

    return JSON.stringify(
      {
        instruction:
          "Based on the user's description and the available entities below, " +
          "produce a complete DashboardWidget configuration. " +
          "Include: widgetType, title, subtitle (optional), gridX (start at 0), gridY, gridW, gridH, " +
          "dataSource (with type, entityKey, aggregate if needed), and config. " +
          "widgetType options: kpi-card, bar-chart, line-chart, pie-chart, data-table, markdown. " +
          "For charts requiring grouped data, set dataSource.aggregate.groupBy. " +
          "Recommended sizes — kpi-card: gridW:3 gridH:2, chart: gridW:6 gridH:3, data-table: gridW:8 gridH:4.",
        userDescription: input.description,
        dashboardId: input.dashboardId,
        existingWidgetCount: existingWidgets.length,
        nextGridY,
        availableEntities: entitySchemas,
      },
      null,
      2,
    )
  },
}
