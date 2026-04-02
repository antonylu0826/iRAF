// packages/core/src/types/module.ts

// ─── Menu ─────────────────────────────────────────────────────────────────────

export interface IMenuItem {
  /** Item type (default "entity") */
  type?: "entity" | "link" | "separator"
  /** type: "entity" — target BO class */
  entity?: Function
  /** Override entity caption */
  caption?: string
  /** Override entity icon (lucide-react icon name) */
  icon?: string
  /** type: "link" — target path */
  path?: string
  /** Order (smaller comes first) */
  order?: number
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

/** Module-provided plugins (handled by packages/react initModulePlugins) */
export interface IModulePlugin {
  category: string
  plugin: {
    name: string
    caption: string
    icon?: string
    /** React.ComponentType<any> (core doesn't depend on React; typed as unknown) */
    component: unknown
  }
}

// ─── Module ───────────────────────────────────────────────────────────────────

/** Input options for defineModule() */
export interface IModuleOptions {
  key: string
  caption: string
  icon?: string
  description?: string
  entities?: Function[]
  controllers?: Function[]
  /** Custom menu structure and order. If omitted, auto-generated from entities. */
  menu?: IMenuItem[]
  /** Dashboard React component (reserved; Phase 5b doesn't implement routing) */
  dashboard?: unknown
  /** Required module keys. Throws in use() if missing. */
  requires?: string[]
  /** Module-provided plugins (handled by packages/react) */
  plugins?: IModulePlugin[]
  /** Module-defined roles (aggregated by ModuleRegistry.getAllRoles()) */
  roles?: string[]
  /** Sidebar visibility: only users with these roles can see the module */
  allowedRoles?: string[]
  /** Module-level i18n dictionary (lang -> key/value) */
  i18n?: Record<string, Record<string, string>>

  // ─── Lifecycle hooks ────────────────────────────────────────────────────────

  /**
   * Client-side init hook. Runs before React render and initPlugins().
   * Suitable for: registering slot plugins, subscribing EventBus, client services setup.
   */
  onInit?: () => void | Promise<void>

  /**
   * Server-side init hook. Runs after remult starts.
   * Suitable for: WebSocket setup, scheduled tasks, server services.
   */
  onServerInit?: () => void | Promise<void>

  /**
   * Module destroy hook. Mainly for tests or future hot-reload support.
   * Suitable for: EventBus unsubscription, clearing timers, etc.
   */
  onDestroy?: () => void
}

/** Registered module definition (Readonly IModuleOptions returned by defineModule) */
export type IModuleDef = Readonly<IModuleOptions>
