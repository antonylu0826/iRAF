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
│   ├── shared/               # 前後端共用
│   │   ├── base/
│   │   │   └── BaseObject.ts       # 所有 BO 的基底類別
│   │   ├── entities/               # 業務實體（BO 定義）
│   │   │   ├── Customer.ts
│   │   │   └── Order.ts
│   │   └── index.ts                # EntityRegistry.register(...)
│   ├── server/
│   │   └── index.ts                # iRAF server 初始化
│   └── frontend/
│       ├── main.tsx                # iRAFApp bootstrap
│       ├── overrides/              # 自訂 component（選用）
│       │   └── CustomerForm.tsx
│       └── modules/                # 模組擴充（選用）
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

### Phase 5a — 插件系統（Plugin Registry） [ ]

插件以**分類（category）**為單位統一管理，目前規劃兩大類，但架構設計為可擴充 — 日後可新增任意分類（如 `"exporter"`、`"importer"`、`"chart"` 等）而不需修改框架核心。

```ts
// 統一的 PluginRegistry，以 category 分類
PluginRegistry.register("view",    "list",     ListView)
PluginRegistry.register("control", "text",     TextInput)
PluginRegistry.register("view",    "kanban",   KanbanListView)  // 擴充
PluginRegistry.register("exporter","excel",    ExcelExporter)   // 日後擴充

// 查詢
PluginRegistry.resolve("view",    "list")     // → ListView
PluginRegistry.resolve("control", "richtext") // → RichTextEditor
PluginRegistry.getAll("view")                 // → 所有已登記的 View 插件
```

現有的 ListView / DetailView 也納入此機制。

#### View 插件 — 實體的呈現方式
| 名稱 | Component | 說明 |
|------|-----------|------|
| `"list"` | `ListView` | 預設表格清單（現有） |
| `"detail"` | `DetailView` | 預設表單（現有） |
| `"kanban"` | `KanbanListView` | 看板（擴充） |
| `"calendar"` | `CalendarView` | 行事曆（擴充） |
| `"tree"` | `TreeListView` | 樹狀清單（擴充） |

```ts
// 框架啟動時自動登記內建 View
ViewRegistry.register("list",   ListView)
ViewRegistry.register("detail", DetailView)

// 外部模組擴充
ViewRegistry.register("kanban", KanbanListView)

// @iEntity 指定 defaultView
@iEntity("tasks", { caption: "任務", defaultView: "kanban" })
```

#### Control 插件 — 欄位的編輯控制項
| 名稱 | Component | 對應 iField 類型 |
|------|-----------|-----------------|
| `"text"` | `TextInput` | string（預設） |
| `"number"` | `NumberInput` | number（預設） |
| `"date"` | `DatePicker` | date（預設） |
| `"datetime"` | `DateTimePicker` | date |
| `"time"` | `TimePicker` | date |
| `"boolean"` | `Checkbox` | boolean（預設） |
| `"textarea"` | `Textarea` | string |
| `"password"` | `PasswordInput` | string（擴充） |
| `"richtext"` | `RichTextEditor` | string（擴充） |
| `"spreadsheet"` | `SpreadsheetInput` | json（擴充） |

```ts
// @iField 使用 control 字串指定控制項
@iField.string({ caption: "描述", control: "textarea" })
@iField.string({ caption: "密碼", control: "password" })
@iField.string({ caption: "內容", control: "richtext" })
```

#### 任務清單
- [ ] 定義泛型 `PluginRegistry`（category / name / component，支援任意擴充分類）
- [ ] 現有 `ListView` / `DetailView` 納入 `PluginRegistry("view")`
- [ ] 現有 input 類型納入 `PluginRegistry("control")`（text / number / date / boolean）
- [ ] `IEntityOptions` 新增 `defaultView` 欄位
- [ ] `IFieldOptions` 新增 `control` 字串欄位（取代 `inputComponent`）
- [ ] `DetailView` 改由 `ControlRegistry.resolve(control)` 動態載入控制項
- [ ] iRAFApp 路由改由 `ViewRegistry.resolve(defaultView)` 決定清單頁元件
- [ ] 新增 `textarea` / `password` 兩個內建 Control（常用，納入核心）
- [ ] Demo 示範：Customer `description` 欄位使用 `"textarea"`

---

### Phase 5b — 模組系統（Module System） [ ]
- [ ] `@iModule` decorator（caption / icon / description / menu / dashboard / requires）
- [ ] `EntityRegistry.use(SalesModule)` 取代 `register()`
- [ ] Menu 定義（明確指定選單結構與順序）
- [ ] Dashboard 機制（`/sales` 路由掛載自訂 component）
- [ ] 模組間硬依賴（缺少 requires 的模組時啟動報錯）
- [ ] 模組也可打包自己的 View / Control 插件

---

### Phase 6 — 開發體驗 [ ]
- [ ] CLI 工具（`iraf new entity Customer`）
- [ ] VS Code Extension（BO metadata 智能提示）
- [ ] AI Agent prompt templates（讓 agent 能按框架慣例生成 BO）

### Phase 7 — 進階安全與用戶體驗 [ ]
- [ ] 使用者管理介面優化（角色指派與狀態管理）
- [ ] 「重設密碼」自定義動作（iAction 設計）
- [ ] 忘記密碼與 Email 驗證機制
- [ ] 密碼強度規則引擎與安全性加強

---

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
