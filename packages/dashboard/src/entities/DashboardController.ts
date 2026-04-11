import { iController, iAction } from "@iraf/core"
import { remult } from "remult"
import { Dashboard } from "./Dashboard.js"
import { DashboardWidget } from "./DashboardWidget.js"

@iController(Dashboard)
export class DashboardController {
  @iAction({
    caption: "複製 Dashboard",
    icon: "Copy",
    allowedRoles: ["admins", "managers", "users"],
  })
  static async duplicate(id: string): Promise<string> {
    const dashRepo = remult.repo(Dashboard)
    const widgetRepo = remult.repo(DashboardWidget)

    const original = await dashRepo.findId(id)
    if (!original) throw new Error("Dashboard not found")

    // Create copy
    const copyData = dashRepo.create()
    Object.assign(copyData, {
      name: `${original.name} (副本)`,
      description: original.description,
      icon: original.icon,
      order: original.order + 1,
      viewPermissions: original.viewPermissions,
      editPermissions: original.editPermissions,
      isPublic: original.isPublic,
      columns: original.columns,
      gap: original.gap,
    })
    const copy = await dashRepo.insert(copyData)

    // Copy widgets
    const widgets = await widgetRepo.find({ where: { dashboardId: id } })
    for (const w of widgets) {
      const wCopy = widgetRepo.create()
      Object.assign(wCopy, {
        dashboardId: copy.id,
        widgetType: w.widgetType,
        title: w.title,
        subtitle: w.subtitle,
        gridX: w.gridX,
        gridY: w.gridY,
        gridW: w.gridW,
        gridH: w.gridH,
        order: w.order,
        dataSource: w.dataSource,
        config: w.config,
      })
      await widgetRepo.insert(wCopy)
    }

    return copy.id
  }
}
