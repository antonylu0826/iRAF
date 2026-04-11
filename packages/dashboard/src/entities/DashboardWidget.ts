import { iEntity, iField, BaseObject } from "@iraf/core"
import type { IWidgetDataSource } from "../types.js"

@iEntity("dashboard-widgets", {
  caption: "Dashboard Widget",
  icon: "BarChart3",
  allowedRoles: {
    read:   ["admins", "managers", "users"],
    create: ["admins", "managers", "users"],
    update: ["admins", "managers", "users"],
    delete: ["admins", "managers", "users"],
  },
  defaultOrder: { order: "asc" },
})
export class DashboardWidget extends BaseObject {
  @iField.string({ caption: "Dashboard", ref: "dashboards", order: 1 })
  dashboardId = ""

  // ─── Widget type & display ──────────────────────────────
  @iField.string({
    caption: "類型",
    order: 2,
    options: ["kpi-card", "bar-chart", "line-chart", "pie-chart", "data-table", "markdown"],
  })
  widgetType = "kpi-card"

  @iField.string({ caption: "標題", order: 3 })
  title = ""

  @iField.string({ caption: "副標題", order: 4 })
  subtitle = ""

  // ─── Grid position ─────────────────────────────────────
  @iField.number({ caption: "X", order: 10 })
  gridX = 0

  @iField.number({ caption: "Y", order: 11 })
  gridY = 0

  @iField.number({ caption: "寬度", order: 12 })
  gridW = 4

  @iField.number({ caption: "高度", order: 13 })
  gridH = 2

  @iField.number({ caption: "排序", order: 14 })
  order = 0

  // ─── Data source ────────────────────────────────────────
  @iField.json({ caption: "資料來源", order: 20, hidden: true })
  dataSource: IWidgetDataSource = { type: "entity" }

  // ─── Type-specific config ───────────────────────────────
  @iField.json({ caption: "設定", order: 30, hidden: true })
  config: Record<string, any> = {}
}
