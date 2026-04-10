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

  // ─── field type → default control ───────────────────────────────────────────
  PluginRegistry.setDefault("control", "string",  "text")
  PluginRegistry.setDefault("control", "number",  "number")
  PluginRegistry.setDefault("control", "date",    "date")
  PluginRegistry.setDefault("control", "boolean", "boolean")
  PluginRegistry.setDefault("control", "json",       "text")
  PluginRegistry.setDefault("control", "collection", "subgrid")
}
