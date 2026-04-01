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
}

/** 已登記的模組定義（等同 IModuleOptions，由 defineModule 回傳） */
export type IModuleDef = Readonly<IModuleOptions>
