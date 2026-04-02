# iRAF — 架構規劃書

> **iRAF**（i Rapid Application Framework）是一個以 TypeScript 實現的全端通用業務應用框架。
> 核心精神繼承自 DevExpress XAF 的「元數據驅動」理念，但完全重新設計，不考慮與 XAF 相容。
> 開發流程以 AI Agent 輔助為一等公民。

---

## 設計原則

1. **BO 為單一真相來源** — 實體定義一次，UI、API、驗證、權限全部從中衍生
2. **預設有效、覆寫自由** — 開箱即用的 CRUD 介面，每個層次都能替換自訂 component
3. **AI Agent 友善** — 統一的結構與命名慣例，讓不同 agent 的產出保持一致
4. **漸進式複雜度** — 簡單的 BO 不需要任何額外設定；複雜需求才引入進階功能

---

## 技術棧

| 層次 | 技術 | 說明 |
|------|------|------|
| 語言 | TypeScript | 全端統一語言 |
| 後端框架 | Node.js + Express（或 Fastify） | Remult 的 host |
| ORM / API | **Remult** | BO 定義、型別安全 API、DataProvider 抽象 |
| 資料庫 | Remult DataProvider 抽象（預設 SQLite → 可換） | 開發用 SQLite，生產可切 PostgreSQL |
| 前端框架 | React + Vite | |
| UI 元件庫 | shadcn/ui + Tailwind CSS | 預設 UI 的基礎元件 |
| 圖示 | lucide-react | |
| 路由 | React Router v7 | |
| 表單 | React Hook Form + Zod（驗證層） | 搭配 Remult 後端驗證雙層保護 |

---

## 專案結構（框架使用者視角）

```
my-app/
├── src/
│   ├── modules/                        # 模組（每個子目錄一個功能模組）
│   │   ├── sales/
│   │   │   ├── entities/
│   │   │   │   ├── Customer.ts         # BO 定義
│   │   │   │   └── Order.ts
│   │   │   ├── controllers/
│   │   │   │   └── OrderController.ts  # 業務邏輯
│   │   │   ├── controls/               # 模組自帶的 Control 插件（選用）
│   │   │   │   └── CurrencyInput.tsx
│   │   │   └── index.ts               # defineModule(...)
│   │   ├── system/
│   │   │   └── index.ts               # defineModule(...)（內建 iRAFUser）
│   │   └── index.ts                   # ModuleRegistry.use(SalesModule, SystemModule)
│   ├── server/
│   │   └── index.ts                   # iRAF server 初始化
│   └── main.tsx                       # iRAFApp bootstrap
└── package.json
```

---

## 核心概念

### 1. BaseObject

所有 BO 的基底類別，自動提供稽核欄位。

```ts
// shared/base/BaseObject.ts
export abstract class BaseObject {
  @iField.cuid()
  id = "";

  @iField.date({ caption: "建立時間", readOnly: true, hidden: true })
  createdAt = new Date();

  @iField.date({ caption: "更新時間", readOnly: true, hidden: true })
  updatedAt = new Date();

  @iField.string({ caption: "建立者", readOnly: true, hidden: true })
  createdBy = "";

  @iField.string({ caption: "更新者", readOnly: true, hidden: true })
  updatedBy = "";
}
```

---

### 2. @iEntity / @iField — BO 定義 Decorator

`@iEntity` 擴充 Remult 的 `@Entity`，加入框架層 metadata：

```ts
@iEntity("customers", {
  caption: "客戶",
  icon: "Users",
  module: "銷售",              // 左側導航分群
  defaultOrder: { name: "asc" },
})
export class Customer extends BaseObject {
  @iField.string({ caption: "姓名", required: true })
  name = "";

  @iField.string({ caption: "電話", group: "聯絡資訊" })
  phone = "";

  @iField.string({ caption: "Email", group: "聯絡資訊" })
  email = "";

  @iField.toMany(() => Order, { caption: "訂單" })
  orders?: Order[];
}
```

**`@iField.*` 支援的 UI hints：**

| 選項 | 說明 |
|------|------|
| `caption` | 顯示名稱（表單標籤、表格標頭） |
| `group` | 表單欄位分組 |
| `required` | 必填驗證（前後端雙層） |
| `readOnly` | 唯讀（不渲染 input） |
| `hidden` | 在預設 UI 不顯示 |
| `inputComponent` | 覆寫用自訂 React component |
| `displayFormat` | 值的顯示格式（日期、數字） |
| `order` | 表單中的欄位排序 |

---

### 3. EntityRegistry

框架的核心登記簿，驅動導航、UI、權限。

```ts
// shared/index.ts
import { EntityRegistry } from "iraf/core";

EntityRegistry.register(Customer, Order, Product);
```

登記後框架自動：
- 生成左側導航選單（依 `module` 分群）
- 為每個實體建立 ListView 路由（`/customers`）
- 為每個實體建立 DetailView 路由（`/customers/:id`、`/customers/new`）

---

### 4. UI 引擎 — ListView & DetailView

框架根據 BO metadata 自動渲染預設介面，無需寫任何 UI 程式碼。

#### ListView
- 自動從欄位 metadata 生成表格欄位（排除 `hidden: true`）
- 支援排序、分頁、搜尋
- 右上角「新增」按鈕導航至 DetailView
- 列點擊導航至 DetailView（編輯模式）

#### DetailView
- 根據 `group` 分組渲染欄位
- 儲存 / 取消按鈕
- 後端 BackendMethod 執行業務邏輯（Unit of Work 模式）
- 驗證錯誤即時顯示

#### 覆寫機制（三個層次）

```
層次 1：欄位級覆寫 — @iField.string({ inputComponent: MyInput })
層次 2：View 級覆寫 — EntityRegistry.register(Customer, { detailView: CustomerForm })
層次 3：完全自訂路由 — 直接定義 React Router 路由（框架不干涉）
```

---

### 5. App Shell

```tsx
// frontend/main.tsx
import { iRAFApp } from "iraf/react";
import "../shared"; // 觸發 EntityRegistry.register(...)

createRoot(document.getElementById("root")!).render(
  <iRAFApp
    title="My Business App"
    theme="light"
  />
);
```

App Shell 提供：
- 左側導航（從 EntityRegistry 自動生成，依模組分群）
- 頂部 Header（標題、登入用戶資訊）
- 主內容區（React Router `<Outlet>`）

---

### 6. 安全與權限（RBAC）

```ts
@iEntity("orders", {
  caption: "訂單",
  allowedRoles: {
    read: ["admin", "sales", "viewer"],
    create: ["admin", "sales"],
    update: ["admin", "sales"],
    delete: ["admin"],
  }
})
export class Order extends BaseObject { ... }
```

- 後端：透過 Remult 的 `allowApiCrud` 結合 `remult.user.roles` 實現
- 前端：依權限自動隱藏「新增」按鈕、停用欄位、隱藏刪除選項

---

### 7. Controller（業務邏輯層）

複雜的業務操作透過 Controller 封裝，確保事務一致性：

```ts
// shared/controllers/OrderController.ts
export class OrderController {
  @iAction({
    caption: "確認訂單",
    allowedRoles: ["admin", "sales"],
    icon: "CheckCircle",
  })
  static async confirmOrder(orderId: string): Promise<void> {
    await remult.dataProvider.transaction(async (tx) => {
      // 原子性業務操作
    });
  }
}
```

`@iAction` 讓 BackendMethod 自動出現在 DetailView 的 Action Bar。

---

## 開發階段規劃

### Phase 0 — 專案鷹架 [x]
- [x] Monorepo 結構（`core/` + `react/` + `demo/`）
- [x] 開發工具鏈：Vite、TypeScript、ESLint、Prettier

### Phase 1 — 核心底座 [x]
- [x] `BaseObject` 實作（稽核欄位 + saving hook）
- [x] `@iEntity` / `@iField` decorator 實作
- [x] `EntityRegistry` 實作
- [x] Remult server 整合

### Phase 2 — UI 引擎 MVP [x]
- [x] App Shell（Layout + 導航）
- [x] ListView 自動渲染
- [x] DetailView 自動渲染（含表單分組）
- [x] 三層覆寫機制

### Phase 3 — 安全層 [x]
- [x] RBAC 模型（User / Role / Permission）
- [x] 前後端雙層權限控制
- [x] 登入 / Session 管理

### Phase 4 — 業務功能層 [x]
- [x] `@iAction` / Controller 整合
- [x] Audit Trail（變更歷史自動記錄）
- [x] 業務驗證規則引擎（前後端共享）
- [x] Conditional Appearance（依數據狀態控制欄位唯讀/隱藏）

### Phase 5a — 插件系統（Plugin Registry） [x]

插件以**分類（category）**為單位統一管理，架構設計為可擴充 — 日後可新增任意分類而不需修改框架核心。

#### 架構設計

```ts
// ─── Plugin Metadata ──────────────────────────────────────────────────────────
interface IPluginMeta {
  name: string                // 唯一 key（同 category 內）
  caption: string             // 顯示名稱
  icon?: string               // lucide-react 圖示名稱
  component: React.ComponentType<any> | (() => Promise<{ default: React.ComponentType<any> }>)
}

// ─── 統一 PluginRegistry API ──────────────────────────────────────────────────
PluginRegistry.register("list-view",   { name: "list",     caption: "表格清單", component: ListView })
PluginRegistry.register("detail-view", { name: "detail",   caption: "表單",     component: DetailView })
PluginRegistry.register("control",     { name: "text",     caption: "文字",     component: TextInput })

PluginRegistry.resolve("list-view", "list")     // → IPluginMeta
PluginRegistry.getAll("control")                // → IPluginMeta[]

// ─── 重複登記策略：報錯（避免意外覆蓋） ─────────────────────────────────────────
PluginRegistry.register("control", { name: "text", ... }) // ❌ throw Error

// ─── Default Mapping（field type → control name） ─────────────────────────────
PluginRegistry.setDefault("control", "string",  "text")
PluginRegistry.setDefault("control", "number",  "number")
PluginRegistry.setDefault("control", "date",    "date")
PluginRegistry.setDefault("control", "boolean", "boolean")
PluginRegistry.setDefault("control", "json",    "json")
PluginRegistry.setDefault("list-view",   "*",   "list")
PluginRegistry.setDefault("detail-view", "*",   "detail")

// ─── Lazy Loading（預留） ─────────────────────────────────────────────────────
// component 欄位支援 () => import(...)，但 Phase 5a 只處理同步
// 日後加 resolveAsync() 即可
```

#### Props 契約

所有同 category 的插件遵循統一介面：

```ts
// ─── Control Props ─────────────────────────────────────
interface IControlProps {
  value: any
  onChange: (value: any) => void
  disabled: boolean
  field: IFieldMeta
  entity: Record<string, any>   // 可做跨欄位互動
}

// ─── List View Props ────────────────────────────────────
interface IListViewProps {
  entityClass: new () => object
  viewOptions?: Record<string, any>
}

// ─── Detail View Props ──────────────────────────────────
interface IDetailViewProps {
  entityClass: new () => object
  id?: string
  viewOptions?: Record<string, any>
}

// @iEntity 集中設定 viewOptions（方案 A）
@iEntity("tasks", {
  caption: "任務",
  defaultListView: "kanban",
  viewOptions: { groupByField: "status" },
})
```

#### 插件分類

| Category | 說明 | 預設解析 |
|----------|------|---------|
| `list-view` | 實體清單頁 | → `"list"` (ListView) |
| `detail-view` | 實體表單頁 | → `"detail"` (DetailView) |
| `lookup-view` | Reference 欄位彈出選取 | → 未來 |
| `control` | 欄位編輯控制項 | string→`"text"`, number→`"number"`, date→`"date"`, boolean→`"boolean"`, json→`"json"` |
| `app-bar` | 頂部功能列項目 | 未來 |
| `side-menu` | 側邊欄項目 | 未來 |

#### Control 插件清單

| 名稱 | Component | 對應 iField 類型 | Phase 5a 實作 |
|------|-----------|-----------------|:---:|
| `"text"` | `TextInput` | string（預設） | ✅ |
| `"number"` | `NumberInput` | number（預設） | ✅ |
| `"date"` | `DateInput` | date（預設） | ✅ |
| `"boolean"` | `Checkbox` | boolean（預設） | ✅ |
| `"textarea"` | `Textarea` | string | ✅ |
| `"password"` | `PasswordInput` | string | ✅ |
| `"datetime"` | `DateTimePicker` | date | 未來 |
| `"time"` | `TimePicker` | date | 未來 |
| `"richtext"` | `RichTextEditor` | string | 未來 |
| `"spreadsheet"` | `SpreadsheetInput` | json | 未來 |

```ts
// @iField 使用 control 字串指定控制項
@iField.string({ caption: "描述", control: "textarea" })
@iField.string({ caption: "密碼", control: "password" })
```

#### 任務清單
- [x] 定義 `IPluginMeta` 介面 + `IControlProps` / `IListViewProps` / `IDetailViewProps`
- [x] 實作泛型 `PluginRegistry`（register / resolve / getAll / setDefault，重複報錯）
- [x] `IFieldOptions` 新增 `control` 字串欄位
- [x] `IEntityOptions` 新增 `defaultListView` / `viewOptions` 欄位
- [x] 實作 6 個內建 Control component（text / number / date / boolean / textarea / password）
- [x] 框架啟動時自動登記內建 list-view、detail-view、control
- [x] `DetailView` 改由 `PluginRegistry.resolve("control", ...)` 動態載入控制項
- [x] `iRAFApp` 路由改由 `PluginRegistry.resolve("list-view", ...)` 決定清單頁元件
- [x] Demo 示範：Customer 新增 `notes` 欄位使用 `"textarea"`
- [x] 測試：PluginRegistry 的 register / resolve / setDefault / 重複報錯

---

### Phase 5b — 模組系統（Module System） [x]

模組（Module）是功能的封裝單位，整合實體、控制器、插件、選單結構。
取代散落式的 `EntityRegistry.register()` + `@iEntity({ module })` 寫法。

#### 架構設計

```ts
// ─── Module 定義 ──────────────────────────────────────────────────────────────
import { defineModule } from "@iraf/core"

export const SalesModule = defineModule({
  key: "sales",
  caption: "銷售",
  icon: "ShoppingCart",
  description: "銷售管理模組",
  entities: [Customer, Order],
  controllers: [CustomerController],
  menu: [                                 // 選用：不指定則自動從 entities 生成
    { entity: Customer, order: 1 },
    { entity: Order, order: 2 },
    { type: "separator" },
    { type: "link", caption: "報表", icon: "BarChart", path: "/sales/reports" },
  ],
  dashboard: SalesDashboard,              // 預留：React component，掛載 /sales
  requires: [],                           // 硬依賴：缺少時 use() 拋錯
  plugins: [                              // 模組自帶的插件
    { category: "control", plugin: { name: "currency", caption: "貨幣", component: CurrencyInput } },
  ],
})

// ─── 使用方式 ──────────────────────────────────────────────────────────────────
import { ModuleRegistry } from "@iraf/core"
ModuleRegistry.use(SalesModule, SystemModule)
```

#### 型別定義

```ts
// ─── IMenuItem ────────────────────────────────────────────────────────────────
interface IMenuItem {
  type?: "entity" | "link" | "separator"
  entity?: Function            // type: "entity"（預設）
  caption?: string             // 覆寫 entity caption
  icon?: string                // 覆寫 entity icon
  path?: string                // type: "link" 的目標路徑
  order?: number
}

// ─── IModulePlugin ────────────────────────────────────────────────────────────
interface IModulePlugin {
  category: string
  plugin: { name: string; caption: string; icon?: string; component: unknown }
}

// ─── IModuleDef ───────────────────────────────────────────────────────────────
interface IModuleDef {
  key: string
  caption: string
  icon?: string
  description?: string
  entities?: Function[]
  controllers?: Function[]
  menu?: IMenuItem[]
  dashboard?: unknown          // React.ComponentType（core 不依賴 React）
  requires?: string[]
  plugins?: IModulePlugin[]
}
```

#### ModuleRegistry

```ts
class ModuleRegistry {
  static use(...modules: IModuleDef[]): void   // 登記（驗依賴→登記 entities/controllers→儲存）
  static getAll(): IModuleDef[]                // 所有模組（按 use 順序）
  static get(key: string): IModuleDef          // 取得單一模組
  static getMenu(key: string): IMenuItem[]     // menu 或自動生成
  static clear(): void                         // 測試用
}
```

`use()` 內部自動呼叫 `EntityRegistry.register()` 登記實體。
模組的 `plugins` 由 packages/react 的 `initModulePlugins()` 處理（core 不依賴 React）。

#### 路由結構（巢狀）

```
/sales                → SalesDashboard（或 redirect 到第一個 entity）
/sales/customers      → Customer ListView
/sales/customers/:id  → Customer DetailView
/system               → redirect 到 /system/iraf-users
/system/iraf-users    → iRAFUser ListView
```

#### 棄用 `@iEntity.module`

`IEntityOptions` / `IEntityMeta` 移除 `module` 欄位。
模組歸屬改由 `defineModule({ entities: [...] })` 決定。

#### Demo 轉換

```ts
// apps/demo/src/modules/SalesModule.ts
export const SalesModule = defineModule({
  key: "sales",
  caption: "銷售",
  icon: "ShoppingCart",
  entities: [Customer],
  controllers: [CustomerController],
})

// apps/demo/src/modules/SystemModule.ts
export const SystemModule = defineModule({
  key: "system",
  caption: "系統管理",
  icon: "Settings",
  entities: [iRAFUser],
})

// apps/demo/src/modules/index.ts
ModuleRegistry.use(SalesModule, SystemModule)
```

#### 任務清單
- [x] 定義 `IModuleDef` / `IMenuItem` / `IModulePlugin` 型別（packages/core）
- [x] 實作 `defineModule()` 函式（packages/core）
- [x] 實作 `ModuleRegistry`（use / getAll / get / getMenu / clear）
- [x] 棄用 `IEntityOptions.module` / `IEntityMeta.module`（packages/core）
- [x] `Sidebar` 改讀 `ModuleRegistry` 生成選單（packages/react）
- [x] `iRAFApp` 路由改為巢狀 `/{module.key}/{entity.key}`（packages/react）
- [x] `DetailView` / `ListView` 路徑修正（返回、新增等按鈕）
- [x] packages/react `initModulePlugins()` 處理模組自帶插件
- [x] Demo 目錄重組：`shared/` → `modules/sales/` + `modules/system/`
- [x] Demo 重做：建立 SalesModule / SystemModule，移除 `EntityRegistry.register()`
- [x] 測試：ModuleRegistry use / getAll / getMenu / 依賴檢查 / 重複報錯

---

### Phase 5c — 測試與範例模組 (Sample Module) [x]

提供一個全面的 `Sample` 模組，用於測試框架的所有欄位類型、控制項與業務 Action。

#### 任務清單
- [x] 建立 `Sample` 實體定義 (Sample.ts)，涵蓋 string, number, date, boolean, password, textarea
- [x] 實作 `SampleController` (incrementCount, toggleActive)
- [x] 建立 `SampleModule` 並註冊至 `ModuleRegistry`
- [x] 驗證 `iAction` 在 DetailView 的整合
- [x] 驗證 `readOnly` 與 `validate` 在不同欄位類型的行為

---

### Phase 6 — 安全強化與 RBAC 配置 [x]

#### RBAC 設定層
- [x] `SYSTEM_ROLES` + `ModuleRegistry.getAllRoles()` — 聚合系統預設角色與模組宣告角色
- [x] `defineModule({ roles, allowedRoles })` — 角色不符時 Sidebar 自動隱藏整個模組
- [x] `@iField.*({ writeRoles: ['admins'] })` — 欄位寫入角色控制
- [x] `RoleCheck` 型別 — 支援 `string[]` 或 row-level predicate function
- [x] Sidebar 根據 `user.roles` 過濾模組可視性
- [x] DetailView / ListView 支援 row-level predicate（`canSave` / `canEdit` / `canDelete`）

#### 使用者管理 UI
- [x] `AppUser.isActive` 欄位 + 登入封鎖
- [x] `AppUser.roles` 改用 `"roles"` multi-select control plugin
- [x] `UserController.toggleActive` — 切換使用者啟用狀態
- [x] `UserController.resetPassword` — admin 強制重設密碼

#### 密碼安全
- [x] `passwordRules()` — 密碼強度規則引擎（長度、大小寫、數字、特殊字元）
- [-] 忘記密碼 + Email 驗證機制（不在範圍，改為「聯絡管理員重設」）

### Phase 7 — Enum 與 Reference 控制項 [x]

讓 `options` 和 `ref` 這兩個 field metadata 有對應的 UI 控制項，完善 FeatureGallery 的示範。

#### 7.1 Enum / Select Control

- [x] `packages/core`：`IFieldMeta.options` 已存在（Gemini 加入）✓
- [x] `plugins/system`：`SelectInput` control plugin
  - 支援 `string[]`（直接顯示）與 `{ id, caption }[]`（顯示 caption、儲存 id）
  - 樣式與現有 input 一致
- [x] `plugins/system`：DetailView 自動偵測 — 欄位有 `options` 且無明確 `control` → 自動用 `"select"`
- [x] `plugins/system`：`initPlugins` 登記 `"select"` control
- [x] ListView：select 欄位顯示 label（string 直接顯示；`{id,caption}` 顯示 caption）

#### 7.2 Reference / Lookup Control

仿照 XAF 策略：**mount 時 fetch 前 26 筆，自動決定呈現方式，無需開發者指定 mode**。

- [x] `packages/core`：`IFieldMeta.ref` 已存在（Gemini 加入）✓
- [x] `packages/core`：`IFieldMeta.refLabel?: string` — 顯示欄位名稱（未指定時自動取第一個可見 string 欄位）
- [x] `packages/core`：`IFieldMeta.refThreshold?: number` — 覆蓋預設閾值 25（選填）
- [x] `packages/core`：`EntityRegistry.getByKey(key: string)` — 依 entity key 取得 class
- [x] `plugins/system`：`LookupInput` control plugin
  - mount 時 `GET /api/[ref]?_limit=26`
  - `data.length ≤ threshold(25)` → 渲染 `<select>`（preload all）
  - `data.length > threshold` → 渲染「已選值 ＋ [選擇] 按鈕」，點擊開 Modal（搜尋框 ＋ 分頁列表 ＋ 點選確認）
  - 顯示 `refLabel` 欄位，儲存 id；有 loading / error 狀態
- [x] `plugins/system`：DetailView 自動偵測 — 欄位有 `ref` 且無明確 `control` → 自動用 `"lookup"`
- [x] `plugins/system`：`initPlugins` 登記 `"lookup"` control
- [x] ListView：lookup 欄位用 **batch fetch by visible IDs**（`id: { $in: [...ids] }`），解析為 label 顯示；不管資料量多少只打一次 API
- [x] `modules/sample`：`FeatureGallery.assigneeId` 加入 `refLabel: "displayName"`，重建

#### 7.3 測試

- [x] `SelectInput`：string[] / `{id,caption}[]` 選項渲染正確
- [x] `LookupInput`（select 模式）：≤ 25 筆時渲染 `<select>`，顯示 label、儲存 id
- [x] `LookupInput`（modal 模式）：> 25 筆時渲染按鈕，Modal 可搜尋、分頁、選取
- [x] ListView batch fetch：解析 label 正確，只打一次 API

---

### Phase 8 — 架構完善 [ ]

補齊框架的四個基礎設施，讓 iRAF 具備長期擴充能力。

#### 現況

| 設施 | 用途 | 現狀 |
|---|---|---|
| `ModuleRegistry` | 業務功能封裝 | ✅ 已有，缺生命週期 |
| `PluginRegistry` | UI 元件替換 | ✅ 已有，缺 Shell 擴充點 |
| `ServiceRegistry` | 非 UI 能力替換 | ❌ 不存在（auth 寫死） |
| `EventBus` | 跨模組通訊 | ❌ 不存在 |

---

#### 8.1 ServiceRegistry — 非 UI 能力的可替換容器

統一管理可替換的「服務」（與 PluginRegistry 管 UI 元件互補）。

```ts
// packages/core/src/registry/ServiceRegistry.ts
class ServiceRegistry {
  static register<T>(key: string, instance: T): void     // 登記（重複報錯）
  static resolve<T>(key: string): T | undefined           // 取得
  static require<T>(key: string): T                       // 取得（找不到拋錯）
  static override<T>(key: string, instance: T): void      // 覆蓋（明確意圖，不報錯）
  static clear(): void
}
```

##### 內建服務合約

**`IAuthProvider`** — 認證策略

```ts
interface IAuthProvider {
  login(credentials: Record<string, any>): Promise<{ token: string; user: IAuthUser }>
  getUser(req: any): Promise<IAuthUser | undefined>
  loginComponent?: unknown   // 自訂登入頁（core 不依賴 React）
}

interface IAuthUser {
  id: string
  name: string
  roles: string[]
}
```

**`INotifier`** — UI 通知（toast）

```ts
interface INotifier {
  success(message: string): void
  error(message: string): void
  info(message: string): void
  warn(message: string): void
}
```

##### 使用方式

```ts
// app bootstrap — 註冊
ServiceRegistry.register("auth", new JwtAuthProvider({ secret: "..." }))

// 框架內部 — 消費
const auth = ServiceRegistry.require<IAuthProvider>("auth")
const user = await auth.getUser(req)

// 切換 SSO — 只換一行
ServiceRegistry.register("auth", new OAuthProvider({ provider: "azure-ad" }))
```

##### 服務 key 命名

| Key | 合約 | 說明 |
|-----|------|------|
| `auth` | `IAuthProvider` | 認證策略 |
| `notifier` | `INotifier` | UI 通知 |
| `storage` | （未來） | 檔案儲存 |
| `logger` | （未來） | 日誌 |

##### 任務清單

- [x] `packages/core`：實作 `ServiceRegistry`（register / resolve / require / override / clear）
- [x] `packages/core`：定義 `IAuthProvider` / `IAuthUser` / `INotifier` 介面
- [x] `packages/core`：匯出 `ServiceRegistry` 與所有介面
- [x] 重構 `app/src/server/auth.ts` → 抽出 `JwtAuthProvider` 實作 `IAuthProvider`
- [x] 重構 `packages/react/AuthContext` → 從 `ServiceRegistry.require("auth")` 取得 provider
- [x] 統一 `evalRoleCheck` / `hasRole` helper → 移入 `packages/core` 作為共用工具函式
- [x] 測試：register / resolve / require / override / 重複報錯

---

#### 8.2 EventBus — 跨模組事件通訊

```ts
// packages/core/src/events/EventBus.ts
type EventHandler<T = any> = (payload: T) => void | Promise<void>

class EventBus {
  static on<T>(event: string, handler: EventHandler<T>): () => void   // 訂閱，回傳取消函式
  static once<T>(event: string, handler: EventHandler<T>): () => void  // 一次性訂閱
  static emit<T>(event: string, payload: T): Promise<void>            // 發射（handler 平行執行）
  static off(event: string, handler: EventHandler): void               // 取消訂閱
  static clear(): void
}
```

##### 內建事件

| 事件 | Payload | 時機 |
|------|---------|------|
| `entity:saving` | `{ entityClass, item, isNew }` | 儲存前 |
| `entity:saved` | `{ entityClass, item, isNew }` | 儲存後 |
| `entity:deleting` | `{ entityClass, id }` | 刪除前 |
| `entity:deleted` | `{ entityClass, id }` | 刪除後 |
| `auth:login` | `{ user }` | 登入成功 |
| `auth:logout` | `{}` | 登出 |

##### 用途範例

```ts
// 模組 A — 發出事件
await EventBus.emit("order:created", { orderId: "123" })

// 模組 B — 訂閱事件
EventBus.on("order:created", async ({ orderId }) => {
  const notifier = ServiceRegistry.resolve<INotifier>("notifier")
  notifier?.success(`訂單 ${orderId} 已建立`)
})
```

##### 任務清單

- [x] `packages/core`：實作 `EventBus`（on / once / emit / off / clear）
- [x] `packages/core`：匯出 `EventBus` 與 `EventHandler` 型別
- [x] `plugins/system`：DetailView 儲存前後 emit `entity:saving` / `entity:saved`
- [x] `plugins/system`：ListView 刪除前後 emit `entity:deleting` / `entity:deleted`
- [x] `packages/react`：AuthContext 登入/登出 emit `auth:login` / `auth:logout`
- [x] 測試：on / once / emit / off / 多 handler 平行 / clear

---

#### 8.3 Shell Slot — UI 擴充點

不改 `PluginRegistry` API，約定新的 category `"slot"`，Shell 元件掃描並渲染。

##### Slot 命名規範

格式：`{區域}:{名稱}`

| 前綴 | 位置 | 說明 |
|------|------|------|
| `appbar:` | AppHeader 右側 | logout 按鈕左側 |
| `sidebar-header:` | Sidebar 上方 | logo 區下方 |
| `sidebar-footer:` | Sidebar 底部 | 導航列最下方 |
| `list-toolbar:` | ListView 標題列 | 新增按鈕左側 |
| `detail-header:` | DetailView 標題區 | 返回按鈕左側 |
| `detail-toolbar:` | DetailView 工具列 | Action Bar 之後 |

##### Slot Props

```ts
interface ISlotProps {
  context?: Record<string, any>   // 上下文（如 detail slot 可收到 entityClass + item）
}
```

##### 渲染元件

```tsx
// packages/react — 共用 Slot 渲染器
function SlotArea({ prefix, context }: { prefix: string; context?: Record<string, any> }) {
  const slots = PluginRegistry.getAll("slot").filter(p => p.name.startsWith(`${prefix}:`))
  if (slots.length === 0) return null
  return <>
    {slots.map(slot => {
      const Comp = slot.component as React.ComponentType<ISlotProps>
      return <Comp key={slot.name} context={context} />
    })}
  </>
}
```

##### 使用方式

```ts
// 模組自帶 slot plugin
PluginRegistry.register("slot", {
  name: "appbar:notifications",
  caption: "通知鈴",
  component: NotificationBell,
})

// Shell 元件渲染
<SlotArea prefix="appbar" />
```

##### 任務清單

- [x] `packages/react`：實作 `SlotArea` 元件
- [x] `packages/react`：定義 `ISlotProps` 介面並匯出
- [x] `packages/react`：`AppHeader` 加入 `<SlotArea prefix="appbar" />`
- [x] `packages/react`：`Sidebar` 加入 `sidebar-header` / `sidebar-footer` 渲染
- [x] `plugins/system`：`ListView` 加入 `<SlotArea prefix="list-toolbar" />`
- [x] `plugins/system`：`DetailView` 加入 `detail-header` / `detail-toolbar` 渲染
- [x] 測試：slot 登記後能在對應區域渲染

---

#### 8.4 Module Lifecycle — 模組生命週期

`IModuleOptions` 新增生命週期 hook，`ModuleRegistry` 負責執行。

```ts
interface IModuleOptions {
  // ...existing...
  onInit?: () => void | Promise<void>          // client 側，React render 前
  onServerInit?: () => void | Promise<void>    // server 側，remult 啟動後
  onDestroy?: () => void                       // 清理（主要用於測試）
}
```

##### 執行時機

```
Client:
  1. ModuleRegistry.use(...)               ← 登記 entities / controllers
  2. await ModuleRegistry.initAll()         ← 依序呼叫 mod.onInit()
  3. initPlugins()                          ← 登記 UI plugins
  4. React render

Server:
  1. remultExpress(...)                     ← Remult 啟動
  2. await ModuleRegistry.serverInitAll()   ← 依序呼叫 mod.onServerInit()
```

##### 用途範例

```ts
export const NotificationModule = defineModule({
  key: "notification",
  caption: "通知",
  onInit: () => {
    PluginRegistry.register("slot", {
      name: "appbar:notifications",
      caption: "通知鈴",
      component: NotificationBell,
    })
    EventBus.on("entity:saved", handleEntitySaved)
  },
  onServerInit: async () => {
    // 初始化 WebSocket、排程任務等
  },
  onDestroy: () => {
    EventBus.off("entity:saved", handleEntitySaved)
  },
})
```

##### 任務清單

- [x] `packages/core`：`IModuleOptions` 新增 `onInit` / `onServerInit` / `onDestroy`
- [x] `packages/core`：`ModuleRegistry` 新增 `initAll()` / `serverInitAll()` / `destroyAll()`
- [x] `app/src/main.tsx`：bootstrap 順序調整為 `use() → initAll() → initPlugins() → render`
- [x] `app/src/server/index.ts`：remult 啟動後呼叫 `ModuleRegistry.serverInitAll()`
- [x] 測試：lifecycle hook 執行順序正確、async 支援

---

#### 8.5 實作順序

```
Step 1: ServiceRegistry + IAuthProvider + INotifier
        → 建立非 UI 可替換基礎，重構 auth 硬編碼

Step 2: EventBus
        → 純工具類，無外部依賴
        → DetailView / ListView 加 emit

Step 3: Shell Slot + SlotArea
        → Shell 元件加擴充點

Step 4: Module Lifecycle
        → onInit / onServerInit / onDestroy + bootstrap 順序調整
```

---

### Phase 9 — UI/Plugin 強化與快取 [x]

補強近期 UI 體驗與 plugin 共用基礎能力，並新增多組 Master-Detail 示範。

#### 9.1 Sidebar 折疊 + RWD
- [x] Header 左側加入 toggle 按鈕
- [x] Desktop 折疊時 Sidebar 完全隱藏（不顯示 mini）
- [x] Mobile 以 overlay 抽屜呈現，點遮罩可關閉
- [x] Sidebar 群組標題字體加大以提升可讀性

#### 9.2 多組 Master-Detail 示範
- [x] 新增 `DetailFirst` / `DetailSecond` entity
- [x] `MasterItem` 同時掛載三組 collection（DetailItem / DetailFirst / DetailSecond）
- [x] SubGrid 標題支援 entity icon 顯示

#### 9.3 Ref Label 全域快取
- [x] 抽出共用快取 `refLabelCache`（ListView / SubGrid / LookupInput 共用）
- [x] 支援 TTL / clear / stats API
- [x] 對外 export 供其他 plugins 重用

#### 9.4 清理與一致性
- [x] 移除重複/未使用 UI 元件與 initPlugins
- [x] bootstrap 順序對齊（`initAll()` → `initPlugins()`）
- [x] server init 改為先 `serverInitAll()` 再 listen

#### 9.5 後續 UI 微調
- [x] DetailView 群組間距與標題/內容間距調整
- [x] 主視覺區 padding 縮減

---

### Phase 10 — i18n 多國語言機制 [x]

讓核心、插件、模組都能各自提供翻譯，並採用「自然語言即 Key」的 fallback 策略。

#### 10.1 核心 i18n 基建
- [x] 引入 `i18next` / `react-i18next`（packages/react）
- [x] 建立 `I18nRegistry`（addBundle / changeLang / getLang）
- [x] 內建 core 基礎字典（`zh-TW`, `en-US`）
- [x] namespace：`iraf:core`

#### 10.2 Plugin 翻譯支援
- [x] 擴充 `PluginRegistry.register()`，允許傳入 `translations`
- [x] plugin 註冊時自動加入 `iraf:plugin:<name>` namespace
- [x] 核心 plugins（Lookup/Select/Detail/List/Controls）加上翻譯字串

#### 10.3 Module 翻譯支援
- [x] 擴充 `IModuleOptions` 增加 `i18n` 屬性
- [x] `ModuleRegistry.use()` 自動註冊模組字典（`iraf:module:<key>`）
- [x] Entity / Field / Action / Group 標籤統一 `t(..., { defaultValue })`

#### 10.4 前後端訊息一致化
- [x] 前端統一以 `t` 包裝系統 UI 文案
- [ ] 後端錯誤訊息採用 code / key，由前端翻譯（或 Accept-Language 傳遞）

---

### Phase Final — 開發體驗 [ ]
- [ ] `AGENTS.md` — 通用框架指引（任何 agent 讀了就能上手）
- [ ] `CLAUDE.md` — Claude Code 專屬設定
- [ ] `GEMINI.md` / `.cursorrules` — 其他工具的輕量版引用文件
- [ ] `packages/mcp/` — iRAF MCP server（scaffold-module / scaffold-entity / get-example / list-modules）
- [-] CLI 工具（有 AI agent 後價值有限）
- [-] 完整使用文件庫（優先順序不高）

## AI Agent 開發指引（框架設計考量）

為確保不同 AI Agent 產出一致，框架提供：

1. **統一的 BO 範本** — 每個 BO 遵循相同的結構，agent 有清楚的範本可依循
2. **明確的命名慣例** — 檔案名稱、class 名稱、路由命名都有規則
3. **`AGENTS.md`** — 放在專案根目錄，記錄框架慣例，讓 agent 在每次對話開始時載入
4. **Phase-based 開發** — 每個 Phase 是獨立可交付的單元，適合 agent 逐步執行

---

## 備註

- `work with Gemini/` 目錄為 Gemini 的研究材料，完成階段後刪除
- 本計畫為活文件，每個 Phase 執行前會細化為獨立的實作計畫
