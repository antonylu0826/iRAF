/**
 * initPlugins — auto-register built-in iRAF plugins.
 *
 * Call once at app bootstrap (main.tsx).
 * Registers built-in controls plus default list-view / detail-view.
 *
 * External plugins can register after initPlugins via PluginRegistry.register().
 */
import { PluginRegistry } from "@iraf/react"
import { ListView } from "./ListView"
import { DetailView } from "./DetailView"
import {
  TextInput,
  NumberInput,
  DateInput,
  Checkbox,
  TextareaInput,
  PasswordInput,
} from "./controls/builtins"
import { RolesInput } from "./controls/RolesInput"
import { SelectInput } from "./controls/SelectInput"
import { LookupInput } from "./controls/LookupInput"
import { SubGrid } from "./controls/SubGrid"
import { ProgressBar } from "./controls/ProgressBar"
import { ThemeToggle } from "./slots/ThemeToggle"
import { LanguageToggle } from "./slots/LanguageToggle"
import { AiToggle } from "./slots/AiToggle"
import { DashboardListView } from "./dashboard/DashboardListView"
import { DashboardCanvas } from "./dashboard/DashboardCanvas"
import { DashboardNav } from "./dashboard/DashboardNav"
import { KpiCardWidget } from "./widgets/KpiCardWidget"
import { BarChartWidget } from "./widgets/BarChartWidget"
import { LineChartWidget } from "./widgets/LineChartWidget"
import { PieChartWidget } from "./widgets/PieChartWidget"
import { DataTableWidget } from "./widgets/DataTableWidget"
import { MarkdownWidget } from "./widgets/MarkdownWidget"

let _initialized = false

export function initPlugins(): void {
  if (_initialized) return
  _initialized = true

  // ─── list-view ──────────────────────────────────────────────────────────────
  PluginRegistry.register("list-view", {
    name: "list",
    caption: "Table List",
    component: ListView,
  })
  PluginRegistry.setDefault("list-view", "*", "list")

  // ─── detail-view ────────────────────────────────────────────────────────────
  PluginRegistry.register("detail-view", {
    name: "detail",
    caption: "Form",
    component: DetailView,
  })
  PluginRegistry.setDefault("detail-view", "*", "detail")

  // ─── controls ───────────────────────────────────────────────────────────────
  PluginRegistry.register("control", { name: "text",     caption: "Text",          component: TextInput     })
  PluginRegistry.register("control", { name: "number",   caption: "Number",        component: NumberInput   })
  PluginRegistry.register("control", { name: "date",     caption: "Date",          component: DateInput     })
  PluginRegistry.register("control", { name: "boolean",  caption: "Checkbox",      component: Checkbox      })
  PluginRegistry.register("control", { name: "textarea", caption: "Textarea",      component: TextareaInput })
  PluginRegistry.register("control", { name: "password", caption: "Password",      component: PasswordInput })
  PluginRegistry.register("control", { name: "roles",    caption: "Roles",         component: RolesInput    })
  PluginRegistry.register("control", { name: "select",   caption: "Select",        component: SelectInput   })
  PluginRegistry.register("control", { name: "lookup",   caption: "Lookup",        component: LookupInput   })
  PluginRegistry.register("control", { name: "subgrid",  caption: "Subgrid",       component: SubGrid       })
  PluginRegistry.register("control", { name: "progress", caption: "Progress",      component: ProgressBar   })

  // ─── slots ─────────────────────────────────────────────────────────────────
  PluginRegistry.register("slot", {
    name: "appbar:theme-toggle",
    caption: "Theme Toggle",
    component: ThemeToggle,
  })
  PluginRegistry.register("slot", {
    name: "appbar:language-toggle",
    caption: "Language Toggle",
    component: LanguageToggle,
  })
  PluginRegistry.register("slot", {
    name: "appbar:ai-toggle",
    caption: "AI Toggle",
    component: AiToggle,
  })

  // ─── dashboard views ─────────────────────────────────────────────────────────
  PluginRegistry.register("list-view", {
    name: "dashboards",
    caption: "Dashboard List",
    component: DashboardListView,
  })
  PluginRegistry.register("detail-view", {
    name: "dashboard-canvas",
    caption: "Dashboard Canvas",
    component: DashboardCanvas,
  })

  // ─── widget types ──────────────────────────────────────────────────────────
  PluginRegistry.register("widget", { name: "kpi-card",    caption: "KPI 指標卡片", icon: "Hash",      component: KpiCardWidget })
  PluginRegistry.register("widget", { name: "bar-chart",   caption: "長條圖",       icon: "BarChart3", component: BarChartWidget })
  PluginRegistry.register("widget", { name: "line-chart",  caption: "折線圖",       icon: "LineChart", component: LineChartWidget })
  PluginRegistry.register("widget", { name: "pie-chart",   caption: "圓餅圖",       icon: "PieChart",  component: PieChartWidget })
  PluginRegistry.register("widget", { name: "data-table",  caption: "資料表格",     icon: "Table",     component: DataTableWidget })
  PluginRegistry.register("widget", { name: "markdown",    caption: "Markdown",     icon: "FileText",  component: MarkdownWidget })

  PluginRegistry.register("slot", {
    name: "sidebar-header:dashboards",
    caption: "Dashboard Navigation",
    component: DashboardNav,
  })

  // ─── field type → default control ───────────────────────────────────────────
  PluginRegistry.setDefault("control", "string",  "text")
  PluginRegistry.setDefault("control", "number",  "number")
  PluginRegistry.setDefault("control", "date",    "date")
  PluginRegistry.setDefault("control", "boolean", "boolean")
  PluginRegistry.setDefault("control", "json",       "text")
  PluginRegistry.setDefault("control", "collection", "subgrid")
}
