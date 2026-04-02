/**
 * initPlugins — iRAF 框架內建插件自動登記。
 *
 * 在 app bootstrap 時呼叫一次（main.tsx）。
 * 登記：6 個內建 control + 預設 list-view / detail-view。
 *
 * 外部插件在 initPlugins 之後呼叫 PluginRegistry.register() 即可擴充。
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
import { ThemeToggle } from "./slots/ThemeToggle"

let _initialized = false

export function initPlugins(): void {
  if (_initialized) return
  _initialized = true

  // ─── list-view ──────────────────────────────────────────────────────────────
  PluginRegistry.register("list-view", {
    name: "list",
    caption: "表格清單",
    component: ListView,
  })
  PluginRegistry.setDefault("list-view", "*", "list")

  // ─── detail-view ────────────────────────────────────────────────────────────
  PluginRegistry.register("detail-view", {
    name: "detail",
    caption: "表單",
    component: DetailView,
  })
  PluginRegistry.setDefault("detail-view", "*", "detail")

  // ─── controls ───────────────────────────────────────────────────────────────
  PluginRegistry.register("control", { name: "text",     caption: "文字",     component: TextInput     })
  PluginRegistry.register("control", { name: "number",   caption: "數字",     component: NumberInput   })
  PluginRegistry.register("control", { name: "date",     caption: "日期",     component: DateInput     })
  PluginRegistry.register("control", { name: "boolean",  caption: "勾選",     component: Checkbox      })
  PluginRegistry.register("control", { name: "textarea", caption: "多行文字", component: TextareaInput })
  PluginRegistry.register("control", { name: "password", caption: "密碼",     component: PasswordInput })
  PluginRegistry.register("control", { name: "roles",    caption: "角色選擇",  component: RolesInput    })
  PluginRegistry.register("control", { name: "select",   caption: "下拉選單",  component: SelectInput   })
  PluginRegistry.register("control", { name: "lookup",   caption: "關聯選取",  component: LookupInput   })
  PluginRegistry.register("control", { name: "subgrid",  caption: "子表格",    component: SubGrid       })

  // ─── slots ─────────────────────────────────────────────────────────────────
  PluginRegistry.register("slot", {
    name: "appbar:theme-toggle",
    caption: "主題切換",
    component: ThemeToggle,
  })

  // ─── field type → default control ───────────────────────────────────────────
  PluginRegistry.setDefault("control", "string",  "text")
  PluginRegistry.setDefault("control", "number",  "number")
  PluginRegistry.setDefault("control", "date",    "date")
  PluginRegistry.setDefault("control", "boolean", "boolean")
  PluginRegistry.setDefault("control", "json",       "text")
  PluginRegistry.setDefault("control", "collection", "subgrid")
}
