import { defineModule } from "@iraf/core"
import { Dashboard } from "./entities/Dashboard.js"
import { DashboardWidget } from "./entities/DashboardWidget.js"
import { DashboardController } from "./entities/DashboardController.js"

export const DashboardModule = defineModule({
  key: "dashboards",
  caption: "Dashboard",
  icon: "LayoutDashboard",
  entities: [Dashboard, DashboardWidget],
  controllers: [DashboardController],
  // No menu — dashboards are shown via sidebar-header slot (DashboardNav)
  // and rendered via dedicated routes, not the standard module entity pages
  menu: [],
  allowedRoles: ["admins", "managers", "users"],
  i18n: {
    "zh-TW": {
      Dashboard: "儀表板",
      "Dashboard Widget": "儀表板元件",
      名稱: "名稱",
      說明: "說明",
      圖示: "圖示",
      排序: "排序",
      可檢視權限: "可檢視權限",
      可編輯權限: "可編輯權限",
      公開: "公開",
      類型: "類型",
      標題: "標題",
      副標題: "副標題",
      寬度: "寬度",
      高度: "高度",
      "複製 Dashboard": "複製 Dashboard",
    },
  },
})
