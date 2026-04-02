// packages/core/src/types/module.ts

// ─── Menu ─────────────────────────────────────────────────────────────────────

export interface IMenuItem {
  /** 項目類型（預設 "entity"） */
  type?: "entity" | "link" | "separator"
  /** type: "entity" — 指向的 BO class */
  entity?: Function
  /** 覆寫 entity caption */
  caption?: string
  /** 覆寫 entity icon（lucide-react 圖示名稱） */
  icon?: string
  /** type: "link" — 目標路徑 */
  path?: string
  /** 排序（數字越小越前） */
  order?: number
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

/** 模組自帶的插件（交由 packages/react 的 initModulePlugins 處理） */
export interface IModulePlugin {
  category: string
  plugin: {
    name: string
    caption: string
    icon?: string
    /** React.ComponentType<any>（core 不引入 React，以 unknown 宣告） */
    component: unknown
  }
}

// ─── Module ───────────────────────────────────────────────────────────────────

/** defineModule() 的輸入選項 */
export interface IModuleOptions {
  key: string
  caption: string
  icon?: string
  description?: string
  entities?: Function[]
  controllers?: Function[]
  /** 自訂選單結構與順序。未指定則自動從 entities 依序生成 */
  menu?: IMenuItem[]
  /** Dashboard React component（預留，Phase 5b 不實作路由） */
  dashboard?: unknown
  /** 硬依賴的模組 key。use() 時若缺少則拋錯 */
  requires?: string[]
  /** 模組自帶的插件（由 packages/react 處理） */
  plugins?: IModulePlugin[]
  /** 模組自有角色宣告（由 ModuleRegistry.getAllRoles() 聚合） */
  roles?: string[]
  /** 控制 Sidebar 模組可視性：只有具備指定角色的使用者才能看到此模組 */
  allowedRoles?: string[]

  // ─── Lifecycle hooks ────────────────────────────────────────────────────────

  /**
   * Client 側初始化 hook。在 React render 前、initPlugins() 之前執行。
   * 適合用於：登記 slot plugins、訂閱 EventBus、設定 client 端服務。
   */
  onInit?: () => void | Promise<void>

  /**
   * Server 側初始化 hook。在 remult 啟動後執行。
   * 適合用於：初始化 WebSocket、排程任務、server 端服務設定。
   */
  onServerInit?: () => void | Promise<void>

  /**
   * 模組銷毀 hook。主要用於測試清理，或未來支援模組熱替換。
   * 適合用於：取消 EventBus 訂閱、清除 timer 等。
   */
  onDestroy?: () => void
}

/** 已登記的模組定義（等同 IModuleOptions，由 defineModule 回傳） */
export type IModuleDef = Readonly<IModuleOptions>
