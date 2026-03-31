import type { IFieldMeta } from "@iraf/core"
import type React from "react"

// ─── Props 契約 ───────────────────────────────────────────────────────────────

export interface IControlProps {
  value: any
  onChange: (value: any) => void
  disabled: boolean
  field: IFieldMeta
  entity: Record<string, any>
}

export interface IListViewProps {
  entityClass: new () => object
  viewOptions?: Record<string, any>
}

export interface IDetailViewProps {
  entityClass: new () => object
  id?: string
  viewOptions?: Record<string, any>
}

// ─── Plugin Metadata ──────────────────────────────────────────────────────────

export interface IPluginMeta {
  name: string
  caption: string
  icon?: string
  /** 同步元件 或 lazy import 函式（預留 async 支援） */
  component:
    | React.ComponentType<any>
    | (() => Promise<{ default: React.ComponentType<any> }>)
}

// ─── PluginRegistry ───────────────────────────────────────────────────────────

/**
 * PluginRegistry — iRAF 插件登記簿。
 *
 * 統一管理所有可替換的 UI 元件，以 category（分類）+ name（名稱）為 key。
 *
 * ```ts
 * PluginRegistry.register("control", { name: "text", caption: "文字", component: TextInput })
 * PluginRegistry.resolve("control", "text")  // → IPluginMeta
 * PluginRegistry.setDefault("control", "string", "text")
 * PluginRegistry.resolveDefault("control", "string")  // → IPluginMeta | undefined
 * ```
 */
export class PluginRegistry {
  /** category → name → IPluginMeta */
  private static _plugins: Map<string, Map<string, IPluginMeta>> = new Map()

  /** category → typeKey → pluginName */
  private static _defaults: Map<string, Map<string, string>> = new Map()

  /**
   * 登記插件。同 category 下 name 重複時直接報錯，避免意外覆蓋。
   */
  static register(category: string, plugin: IPluginMeta): void {
    if (!this._plugins.has(category)) {
      this._plugins.set(category, new Map())
    }
    const map = this._plugins.get(category)!
    if (map.has(plugin.name)) {
      throw new Error(
        `[PluginRegistry] 插件 "${plugin.name}" 在 category "${category}" 已存在。請使用不同的 name，或先呼叫 unregister()。`
      )
    }
    map.set(plugin.name, plugin)
  }

  /**
   * 取得指定 category + name 的插件。找不到時回傳 undefined。
   */
  static resolve(category: string, name: string): IPluginMeta | undefined {
    return this._plugins.get(category)?.get(name)
  }

  /**
   * 取得指定 category 的所有插件。
   */
  static getAll(category: string): IPluginMeta[] {
    const map = this._plugins.get(category)
    return map ? Array.from(map.values()) : []
  }

  /**
   * 設定 category 下某 typeKey 的預設插件名稱。
   * typeKey 可為具體型別（"string"、"number"）或萬用字元 "*"。
   */
  static setDefault(category: string, typeKey: string, pluginName: string): void {
    if (!this._defaults.has(category)) {
      this._defaults.set(category, new Map())
    }
    this._defaults.get(category)!.set(typeKey, pluginName)
  }

  /**
   * 依 typeKey 解析預設插件。先查具體型別，找不到再查 "*"。
   */
  static resolveDefault(category: string, typeKey: string): IPluginMeta | undefined {
    const defaults = this._defaults.get(category)
    if (!defaults) return undefined
    const name = defaults.get(typeKey) ?? defaults.get("*")
    if (!name) return undefined
    return this.resolve(category, name)
  }

  /**
   * 移除插件（用於測試或重新登記）。
   */
  static unregister(category: string, name: string): void {
    this._plugins.get(category)?.delete(name)
  }

  /** 清除所有登記（主要用於測試）。 */
  static clear(): void {
    this._plugins.clear()
    this._defaults.clear()
  }
}
