/**
 * initPlugins — iRAF 框架內建插件自動登記。
 *
 * 由 iRAFApp 在啟動時呼叫一次。
 * 登記：6 個內建 control + 預設 list-view / detail-view。
 *
 * 外部插件在 initPlugins 之後呼叫 PluginRegistry.register() 即可擴充。
 */
import { PluginRegistry } from "./registry/PluginRegistry"
import { ListView } from "./components/ListView"
import { DetailView } from "./components/DetailView"
import {
  TextInput,
  NumberInput,
  DateInput,
  Checkbox,
  TextareaInput,
  PasswordInput,
} from "./controls/builtins"

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
  PluginRegistry.register("control", { name: "text",     caption: "文字",   component: TextInput     })
  PluginRegistry.register("control", { name: "number",   caption: "數字",   component: NumberInput   })
  PluginRegistry.register("control", { name: "date",     caption: "日期",   component: DateInput     })
  PluginRegistry.register("control", { name: "boolean",  caption: "勾選",   component: Checkbox      })
  PluginRegistry.register("control", { name: "textarea", caption: "多行文字", component: TextareaInput })
  PluginRegistry.register("control", { name: "password", caption: "密碼",   component: PasswordInput })

  // ─── field type → default control ───────────────────────────────────────────
  PluginRegistry.setDefault("control", "string",  "text")
  PluginRegistry.setDefault("control", "number",  "number")
  PluginRegistry.setDefault("control", "date",    "date")
  PluginRegistry.setDefault("control", "boolean", "boolean")
  PluginRegistry.setDefault("control", "json",    "text")
}
