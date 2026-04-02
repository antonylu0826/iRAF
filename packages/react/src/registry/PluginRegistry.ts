import type { IFieldMeta } from "@iraf/core"
import type React from "react"

// ─── Props contracts ─────────────────────────────────────────────────────────

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
  /** Sync component or lazy import factory (reserved for async). */
  component:
    | React.ComponentType<any>
    | (() => Promise<{ default: React.ComponentType<any> }>)
  /** Plugin-specific translations (lang -> { key: value }). */
  translations?: Record<string, Record<string, string>>
}

// ─── PluginRegistry ───────────────────────────────────────────────────────────

/**
 * PluginRegistry — the iRAF plugin registry.
 *
 * Manages all swappable UI components by category + name.
 *
 * ```ts
 * PluginRegistry.register("control", { name: "text", caption: "Text", component: TextInput })
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
   * Register a plugin. Throws if the name already exists in the category.
   */
  static register(category: string, plugin: IPluginMeta): void {
    if (!this._plugins.has(category)) {
      this._plugins.set(category, new Map())
    }
    const map = this._plugins.get(category)!
    if (map.has(plugin.name)) {
      throw new Error(
        `[PluginRegistry] Plugin "${plugin.name}" already exists in category "${category}". Use a different name or call unregister() first.`
      )
    }
    map.set(plugin.name, plugin)

    if (plugin.translations) {
      const ns = `iraf:plugin:${category}:${plugin.name}`
      for (const [lang, dict] of Object.entries(plugin.translations)) {
        import("../i18n/registry").then(({ I18nRegistry }) => {
          I18nRegistry.addBundle(ns, lang, dict)
        })
      }
    }
  }

  /**
   * Resolve a plugin by category + name. Returns undefined if not found.
   */
  static resolve(category: string, name: string): IPluginMeta | undefined {
    return this._plugins.get(category)?.get(name)
  }

  /**
   * Get all plugins under a category.
   */
  static getAll(category: string): IPluginMeta[] {
    const map = this._plugins.get(category)
    return map ? Array.from(map.values()) : []
  }

  /**
   * Set default plugin name for a category + typeKey.
   * typeKey can be a concrete type ("string", "number") or wildcard "*".
   */
  static setDefault(category: string, typeKey: string, pluginName: string): void {
    if (!this._defaults.has(category)) {
      this._defaults.set(category, new Map())
    }
    this._defaults.get(category)!.set(typeKey, pluginName)
  }

  /**
   * Resolve default plugin by typeKey. Falls back to "*".
   */
  static resolveDefault(category: string, typeKey: string): IPluginMeta | undefined {
    const defaults = this._defaults.get(category)
    if (!defaults) return undefined
    const name = defaults.get(typeKey) ?? defaults.get("*")
    if (!name) return undefined
    return this.resolve(category, name)
  }

  /**
   * Remove a plugin (useful for tests or re-registration).
   */
  static unregister(category: string, name: string): void {
    this._plugins.get(category)?.delete(name)
  }

  /** Clear all registrations (mainly for tests). */
  static clear(): void {
    this._plugins.clear()
    this._defaults.clear()
  }
}
