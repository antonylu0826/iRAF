/**
 * initModulePlugins — injects all module-provided plugins into PluginRegistry.
 *
 * Call before iRAFApp route rendering (after ModuleRegistry.use()).
 * Skip when plugin name already exists to avoid duplicate registration.
 *
 * packages/core IModulePlugin.component is typed as unknown,
 * so we cast it to React.ComponentType<any> before registering.
 */
import { ModuleRegistry } from "@iraf/core"
import { PluginRegistry } from "./registry/PluginRegistry"
import type React from "react"

export function initModulePlugins(): void {
  for (const mod of ModuleRegistry.getAll()) {
    for (const entry of mod.plugins ?? []) {
      // Skip if already exists (modules might render multiple times).
      if (PluginRegistry.resolve(entry.category, entry.plugin.name)) continue
      PluginRegistry.register(entry.category, {
        name: entry.plugin.name,
        caption: entry.plugin.caption,
        icon: entry.plugin.icon,
        component: entry.plugin.component as React.ComponentType<any>,
      })
    }
  }
}
