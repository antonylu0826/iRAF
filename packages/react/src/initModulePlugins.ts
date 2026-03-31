/**
 * initModulePlugins — 將所有已登記模組的自帶插件注入 PluginRegistry。
 *
 * 在 iRAFApp 的路由渲染前呼叫（ModuleRegistry.use() 之後）。
 * 若插件 name 已存在則跳過（避免重複登記）。
 *
 * packages/core 的 IModulePlugin.component 是 unknown，
 * 此處強制轉型為 React.ComponentType<any> 再登記。
 */
import { ModuleRegistry } from "@iraf/core"
import { PluginRegistry } from "./registry/PluginRegistry"
import type React from "react"

export function initModulePlugins(): void {
  for (const mod of ModuleRegistry.getAll()) {
    for (const entry of mod.plugins ?? []) {
      // 若已存在則跳過，不拋錯（模組可能被重複 render）
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
