# iRAF Dashboard Module — 完整規劃

> **狀態：** 規劃草案，待確認後實作  
> **前置完成：** AI Panel（packages/ai）已實作完畢，Dashboard 的 AI 輔助建立可直接接入現有 tool-use 體系

---

## 一、設計目標

1. **全域性 Dashboard**：不綁定特定 module，任何使用者都能在權限範圍內查看
2. **細粒度權限**：每個 dashboard 個別設定「誰能看」和「誰能編輯」
3. **AI 輔助建立**：透過右側 AI Panel 自然語言建立 dashboard 和 widget
4. **Widget 外掛體系**：圖表類型可通過 PluginRegistry 擴充
5. **回應式佈局**：Grid-based layout，桌面多欄、手機單欄

---

## 二、架構總覽

```
┌──────────────────────────────────────────────────────────┐
│                     packages/dashboard                    │
│                       @iraf/dashboard                     │
│                                                          │
│  ┌──────────────────────────────┐ ┌────────────────────┐ │
│  │ Entities (data model)        │ │ Controllers        │ │
│  │ ─ Dashboard                  │ │ ─ DashboardCtrl    │ │
│  │ ─ DashboardWidget            │ │   · duplicate()    │ │
│  │                              │ │   · reorder()      │ │
│  └──────────────────────────────┘ └────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Module definition (DashboardModule)                  │ │
│  │  menu: sidebar "link" type → /dashboards/:id        │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                     plugins/system                        │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ DashboardView (list-view plugin, name: "dashboards") │ │
│  │  → renders /dashboards        (dashboard 清單)       │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ DashboardCanvas (detail-view plugin, name:"dash-vi") │ │
│  │  → renders /dashboards/:id    (單一 dashboard)       │ │
│  │  → 包含 edit mode (drag/resize) + view mode          │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Widget plugins (PluginRegistry "widget" category)    │ │
│  │  ─ kpi-card     KPI 指標卡片                         │ │
│  │  ─ bar-chart    長條圖                               │ │
│  │  ─ line-chart   折線圖                               │ │
│  │  ─ pie-chart    圓餅圖                               │ │
│  │  ─ data-table   資料表格                             │ │
│  │  ─ markdown     Markdown 文字                        │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                     packages/ai                           │
│                                                          │
│  Tools 擴充（AI 建立 Dashboard）：                       │
│  ─ create_record → 建立 Dashboard / DashboardWidget      │
│  ─ update_record → 修改 widget 配置                      │
│  ─ 新增 AI tool: generate_widget_config                  │
│    → 根據使用者描述產生 widget JSON（data source + type） │
└──────────────────────────────────────────────────────────┘
```

---

## 三、Entity 設計

### 3.1 Dashboard

```ts
@iEntity("dashboards", {
  caption: "Dashboard",
  icon: "LayoutDashboard",
  allowedRoles: {
    read:   (user, row) => {
      // admin 可看全部；其他人看自己建的或有 view/edit 權限的
    },
    create: ["admins", "managers", "users"],
    update: (user, row) => {
      // admin 可改全部；建立者可改；editRoles 中的角色可改
    },
    delete: ["admins"],
  },
  defaultListView: "dashboards",
  defaultOrder: { order: "asc" },
})
export class Dashboard extends BaseObject {
  // ─── 基本資料 ─────────────────────────────────────────
  @iField.string({ caption: "名稱", required: true, order: 1 })
  name = ""

  @iField.string({ caption: "說明", control: "textarea", order: 2 })
  description = ""

  @iField.string({ caption: "圖示", order: 3 })
  icon = "LayoutDashboard"

  @iField.number({ caption: "排序", order: 4 })
  order = 0

  // ─── 權限 ─────────────────────────────────────────────

  @iField.string({ caption: "建立者", ref: "users", readOnly: true, order: 10 })
  createdBy = ""

  @iField.json({ caption: "可檢視角色/使用者", order: 11, control: "permission-picker" })
  viewPermissions: IPermissionEntry[] = []
  // [{ type: "role", value: "users" }, { type: "user", value: "userId123" }]

  @iField.json({ caption: "可編輯角色/使用者", order: 12, control: "permission-picker" })
  editPermissions: IPermissionEntry[] = []

  @iField.boolean({ caption: "公開（所有登入用戶可見）", order: 13 })
  isPublic = false

  // ─── 佈局 ─────────────────────────────────────────────

  @iField.number({ caption: "欄數", order: 20, hidden: true })
  columns = 12  // Grid columns (CSS grid)

  @iField.number({ caption: "列間距 (px)", order: 21, hidden: true })
  gap = 16
}
```

#### IPermissionEntry

```ts
interface IPermissionEntry {
  type: "role" | "user"
  value: string  // role name 或 user ID
}
```

**權限判斷邏輯（RBAC predicate）：**

```
canView(user, dashboard) =
  user.roles.includes("admins")
  || dashboard.createdBy === user.id
  || dashboard.isPublic
  || dashboard.viewPermissions 包含 user 的 role 或 user.id
  || dashboard.editPermissions 包含 user 的 role 或 user.id（可編輯必可看）

canEdit(user, dashboard) =
  user.roles.includes("admins")
  || dashboard.createdBy === user.id
  || dashboard.editPermissions 包含 user 的 role 或 user.id
```

### 3.2 DashboardWidget

```ts
@iEntity("dashboard-widgets", {
  caption: "Dashboard Widget",
  icon: "BarChart3",
  allowedRoles: {
    read:   ["admins", "managers", "users"],
    create: ["admins", "managers", "users"],
    update: ["admins", "managers", "users"],
    delete: ["admins", "managers", "users"],
  },
  defaultOrder: { order: "asc" },
})
export class DashboardWidget extends BaseObject {
  @iField.string({ caption: "Dashboard", ref: "dashboards", order: 1 })
  dashboardId = ""

  // ─── Widget 類型與顯示 ────────────────────────────────

  @iField.string({
    caption: "類型",
    order: 2,
    options: ["kpi-card", "bar-chart", "line-chart", "pie-chart", "data-table", "markdown"],
  })
  widgetType = "kpi-card"

  @iField.string({ caption: "標題", order: 3 })
  title = ""

  @iField.string({ caption: "副標題", order: 4 })
  subtitle = ""

  // ─── Grid 佈局位置 ───────────────────────────────────

  @iField.number({ caption: "X (起始欄)", order: 10 })
  gridX = 0

  @iField.number({ caption: "Y (起始列)", order: 11 })
  gridY = 0

  @iField.number({ caption: "寬度 (欄)", order: 12 })
  gridW = 4  // 佔 4/12 欄

  @iField.number({ caption: "高度 (列)", order: 13 })
  gridH = 2

  @iField.number({ caption: "排序", order: 14 })
  order = 0

  // ─── 資料來源 ────────────────────────────────────────

  @iField.json({ caption: "資料來源設定", order: 20, hidden: true })
  dataSource: IWidgetDataSource = { type: "entity" }

  // ─── Widget 特定設定 ─────────────────────────────────

  @iField.json({ caption: "Widget 設定", order: 30, hidden: true })
  config: Record<string, any> = {}
  // 每種 widgetType 有不同的 config schema
  // 例如 kpi-card: { field: "total", aggregate: "sum", format: "currency", color: "green" }
  // 例如 bar-chart: { xField: "status", yField: "amount", aggregate: "count" }
}
```

#### IWidgetDataSource

```ts
interface IWidgetDataSource {
  /** 資料取得方式 */
  type: "entity" | "api" | "static"

  // type: "entity" —— 從 Remult entity 查詢
  entityKey?: string
  where?: Record<string, any>   // Remult filter
  orderBy?: Record<string, "asc" | "desc">
  limit?: number
  /** 聚合函數：count / sum / avg / min / max */
  aggregate?: {
    field: string
    function: "count" | "sum" | "avg" | "min" | "max"
    groupBy?: string
  }

  // type: "api" —— 呼叫自訂 endpoint
  url?: string
  method?: "GET" | "POST"
  body?: Record<string, any>

  // type: "static" —— 直接給值（markdown、固定 KPI）
  data?: any
}
```

---

## 四、Widget 類型設計

### 4.1 KPI Card（指標卡片）

```
┌──────────────────┐
│  🟢  +12.5%      │
│    1,234          │
│   總訂單數        │
└──────────────────┘
```

**dataSource.aggregate 範例：**
```json
{ "entityKey": "orders", "aggregate": { "field": "id", "function": "count" } }
```

**config：**
```json
{
  "format": "number",        // number | currency | percent
  "prefix": "",
  "suffix": "筆",
  "color": "green",          // green | blue | red | orange | purple
  "trend": {                 // 選填：與前期比較
    "compareField": "createdAt",
    "period": "month"
  }
}
```

### 4.2 Bar Chart / Line Chart / Pie Chart

**dataSource 範例（bar-chart: 各狀態的訂單數）：**
```json
{
  "entityKey": "orders",
  "aggregate": { "field": "id", "function": "count", "groupBy": "status" }
}
```

**config（bar-chart）：**
```json
{
  "xField": "status",
  "yField": "count",
  "orientation": "vertical",  // vertical | horizontal
  "showLegend": false,
  "colors": ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
}
```

### 4.3 Data Table（資料表格）

**dataSource：**
```json
{
  "entityKey": "users",
  "where": { "roles": { "$contains": "managers" } },
  "orderBy": { "createdAt": "desc" },
  "limit": 10
}
```

**config：**
```json
{
  "columns": ["name", "displayName", "roles", "createdAt"],
  "pageSize": 10
}
```

### 4.4 Markdown（自由文字區塊）

**dataSource：**
```json
{ "type": "static", "data": "## 本月重點\n\n- Q2 目標達成率 85%\n- 新客戶數 +23" }
```

---

## 五、圖表庫選擇

| 候選 | 大小 (gzip) | React 整合 | 功能 | 推薦 |
|---|---|---|---|---|
| **Recharts** | ~40 KB | 原生 React | 常用圖表、composable API | ✅ 推薦 |
| Chart.js + react-chartjs-2 | ~60 KB | 包裝層 | 功能完整但非 React-native | ❌ |
| Nivo | ~80 KB | 原生 React | 精美但偏重 | ❌ |
| ECharts | ~300 KB | 非 React | 功能最強但太重 | ❌ |

**結論：使用 Recharts。** 它是 React-native、composable、輕量，且搭配 Tailwind 色系容易統一視覺。

---

## 六、前端 UI 設計

### 6.1 Dashboard 清單頁 (`/dashboards`)

```
┌──────────────────────────────────────────────────────────────┐
│  Dashboards                                    [＋ 新增]     │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ 📊 銷售總覽  │ │ 👥 人員管理  │ │ 📈 月報     │            │
│  │ 5 widgets   │ │ 3 widgets   │ │ 8 widgets   │            │
│  │ 編輯 · 檢視  │ │ 檢視        │ │ 編輯 · 檢視  │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

- 卡片式 grid layout
- 顯示 name、description、widget 數量、權限 badge
- 點擊進入 DashboardCanvas

### 6.2 DashboardCanvas — 檢視模式 (`/dashboards/:id`)

```
┌──────────────────────────────────────────────────────────────┐
│  ← 銷售總覽                              [✏️ 編輯] [⋯ 更多]  │
├──────────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────────────┐       │
│  │ KPI  │ │ KPI  │ │ KPI  │ │                      │       │
│  │1,234 │ │ $45K │ │ 82%  │ │     Line Chart       │       │
│  │訂單數 │ │ 營收  │ │達成率 │ │    (趨勢圖)          │       │
│  └──────┘ └──────┘ └──────┘ │                      │       │
│  ┌─────────────────────┐    │                      │       │
│  │                     │    └──────────────────────┘       │
│  │     Bar Chart       │    ┌──────────────────────┐       │
│  │  (各狀態訂單分佈)     │    │    Data Table        │       │
│  │                     │    │  (近期訂單)           │       │
│  └─────────────────────┘    └──────────────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

- CSS Grid 12 欄系統
- 每個 widget 根據 `gridX/gridY/gridW/gridH` 定位
- Widget 內部由 PluginRegistry "widget" 類別的外掛渲染
- 純檢視模式：無拖曳，資料自動刷新

### 6.3 DashboardCanvas — 編輯模式

```
┌──────────────────────────────────────────────────────────────┐
│  ← 銷售總覽 (編輯中)                 [➕ 加 Widget] [💾 儲存]  │
├──────────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────────────┐       │
│  │ KPI  ⚙│ │ KPI  ⚙│ │ KPI  ⚙│ │                   ⚙│       │
│  │      │ │      │ │      │ │                      │       │
│  │ drag │ │ drag │ │ drag │ │      drag/resize     │       │
│  └──────┘ └──────┘ └──────┘ │                      │       │
│                              └──────────────────────┘       │
│  拖曳調整位置，拖邊角調整大小                                   │
│  點 ⚙ 開啟 widget 設定面板 (側邊 drawer)                      │
└──────────────────────────────────────────────────────────────┘
```

- 拖曳 + resize（使用 `react-grid-layout`，~10KB gzip，成熟穩定）
- 點選 widget 的 ⚙ icon 開啟右側設定 drawer
- Widget 設定 drawer 內容：
  - 選擇 widget 類型 (kpi-card, bar-chart, ...)
  - 選擇 data source entity + filter + aggregate
  - 類型特定設定 (color, format, columns, ...)

---

## 七、資料取得機制

### 7.1 Widget Data Resolver

每個 widget 在前端載入時，根據 `dataSource` 配置去取資料：

```
DashboardCanvas
  → 載入 Dashboard + 其所有 DashboardWidget
  → 對每個 widget，呼叫 resolveWidgetData(widget.dataSource)
  → 取得資料後傳給對應的 Widget 元件渲染
```

**resolveWidgetData 邏輯：**

```ts
async function resolveWidgetData(ds: IWidgetDataSource): Promise<any> {
  switch (ds.type) {
    case "static":
      return ds.data

    case "entity": {
      // 使用 remult.repo 直接查詢
      const entityClass = EntityRegistry.getByKey(ds.entityKey!)
      const repo = remult.repo(entityClass as any)
      const records = await repo.find({
        where: ds.where,
        orderBy: ds.orderBy,
        limit: ds.limit ?? 1000,
      })

      if (ds.aggregate) {
        return computeAggregate(records, ds.aggregate)
      }
      return records
    }

    case "api": {
      const res = await fetch(ds.url!, {
        method: ds.method ?? "GET",
        headers: getAuthHeaders(),
        body: ds.body ? JSON.stringify(ds.body) : undefined,
      })
      return res.json()
    }
  }
}
```

### 7.2 前端聚合 vs 後端聚合

**初期（Phase 1）：前端聚合。**
- `resolveWidgetData` 取得全部記錄（受 limit 限制）
- `computeAggregate` 在前端做 count / sum / avg / min / max / groupBy
- 優點：不需要額外後端 API，簡單直接
- 限制：大量資料時效能不佳

**後期（Phase 2 可選）：後端聚合 API。**
- 新增 `POST /api/dashboard/aggregate` 端點
- 在 server 端用 SQL/Remult 做 GROUP BY
- 大量資料場景效能更好

---

## 八、Widget Plugin 體系

利用現有 `PluginRegistry` 註冊 widget：

```ts
// initPlugins.ts 中
PluginRegistry.register("widget", {
  name: "kpi-card",
  caption: "KPI 指標卡片",
  icon: "Hash",
  component: KpiCardWidget,
})

PluginRegistry.register("widget", {
  name: "bar-chart",
  caption: "長條圖",
  icon: "BarChart3",
  component: BarChartWidget,
})

// ... line-chart, pie-chart, data-table, markdown
```

**Widget 元件 Props 介面：**

```ts
interface IWidgetProps {
  widget: DashboardWidget          // 完整 entity 資料
  data: any                        // resolveWidgetData 的結果
  loading: boolean
  error?: string
  /** 編輯模式下點 ⚙ 用 */
  onConfigure?: () => void
  /** 是否處於編輯模式 */
  editMode?: boolean
}
```

**擴充方式：** 第三方或業務模組只要 `PluginRegistry.register("widget", {...})` 就能加入自訂 widget 類型。

---

## 九、AI 整合

### 9.1 現有 tools 已能操作

Dashboard 和 DashboardWidget 都是標準 iRAF entity，AI 現有的 `get_schema`、`query_records`、`create_record`、`update_record` 直接可操作。

**使用者：**「幫我建一個銷售總覽 dashboard」

**AI 行為：**
1. `get_schema` → 了解可用 entities
2. `create_record({ entityKey: "dashboards", data: { name: "銷售總覽", ... } })` → 需確認
3. 用 `create_record({ entityKey: "dashboard-widgets", data: { dashboardId, widgetType: "kpi-card", ... } })` 逐一建立 widgets → 需確認

### 9.2 新增專用 tool: `generate_widget_config`

純「建議」工具——AI 根據使用者描述和 entity schema 產生完整的 widget JSON 配置，但不直接寫入 DB（還是走 `create_record` 確認流程）。

```ts
const generateWidgetConfigTool: IAiToolDef = {
  name: "generate_widget_config",
  description: "根據使用者的描述，分析可用的 entity 和欄位，產生適合的 dashboard widget 配置（JSON）。不會直接建立記錄。",
  inputSchema: {
    type: "object",
    properties: {
      description: { type: "string", description: "使用者對 widget 的描述，例如'顯示每月訂單數量的折線圖'" },
      dashboardId: { type: "string", description: "目標 Dashboard ID" },
    },
    required: ["description", "dashboardId"],
  },
  async execute(input) {
    // 1. 列出所有 entities + fields
    // 2. 分析描述，決定 widgetType + dataSource + config
    // 3. 回傳建議的 DashboardWidget JSON
    // AI 本身就有推理能力，這裡主要是把 entity schema 提供給它
    const entities = EntityRegistry.getAllWithMeta()
      .map(({ meta }) => ({
        key: meta.key,
        caption: meta.caption,
        fields: Object.entries(EntityRegistry.getFieldMeta(
          EntityRegistry.getByKey(meta.key)! as any
        )).map(([k, f]) => ({ name: k, type: f._type, caption: f.caption }))
      }))

    return JSON.stringify({
      availableEntities: entities,
      instruction: "Based on the user description and available entities, suggest a DashboardWidget configuration with widgetType, title, dataSource (entityKey, where, aggregate), gridW, gridH, and config fields.",
      userDescription: input.description,
      dashboardId: input.dashboardId,
    }, null, 2)
  },
}
```

### 9.3 AI 對話流程範例

```
使用者：幫我建一個銷售分析 dashboard，我要看訂單總數、營收、
       各狀態分佈，還有最近 10 筆訂單

AI：我來幫您建立「銷售分析」Dashboard。
    [create_record → dashboards → { name: "銷售分析", icon: "TrendingUp" }]
    ⚡ AI 提議執行操作 → [確認執行]

AI：Dashboard 已建立。接下來加入 4 個 widget：
    1. KPI: 訂單總數
    [create_record → dashboard-widgets → { widgetType: "kpi-card", ... }]
    ⚡ 確認

    2. KPI: 營收合計
    [create_record → dashboard-widgets → { widgetType: "kpi-card", ... }]
    ⚡ 確認

    3. Bar Chart: 各狀態訂單分佈
    [create_record → dashboard-widgets → { widgetType: "bar-chart", ... }]
    ⚡ 確認

    4. Data Table: 近 10 筆訂單
    [create_record → dashboard-widgets → { widgetType: "data-table", ... }]
    ⚡ 確認

AI：銷售分析 Dashboard 已完成！包含 4 個 widget。
    您可以前往 /dashboards/{id} 查看。
```

---

## 十、Sidebar 整合

Dashboards 在 sidebar 不走 module menu 機制，而是獨立區塊：

```
┌──────────────────────┐
│  i  iRAF App         │
├──────────────────────┤
│ DASHBOARDS           │ ← 獨立 section，根據使用者權限動態產生
│   📊 銷售總覽         │
│   👥 人員管理         │
│   📈 月報            │
├──────────────────────┤
│ 系統管理             │ ← 原有 module sections
│   使用者              │
│   ...                │
├──────────────────────┤
│ AI 助手              │
│   AI 設定             │
│   AI 對話紀錄          │
└──────────────────────┘
```

**實作方式：** 用 `sidebar-header` slot 註冊一個 `DashboardNav` 元件，它在 mount 時 fetch 使用者可見的 dashboards 並渲染為 NavLink list。

```ts
PluginRegistry.register("slot", {
  name: "sidebar-header:dashboards",
  caption: "Dashboard Navigation",
  component: DashboardNav,
})
```

**路由：** 在 iRAFApp 中加入 `/dashboards` 和 `/dashboards/:id` 兩條全域路由（在 module 路由之前）。

---

## 十一、Package 結構

```
packages/dashboard/
├── package.json          (@iraf/dashboard)
├── tsconfig.json
├── tsup.config.ts        (client/server split，同 @iraf/ai 模式)
├── src/
│   ├── index.ts          (client: module + entities)
│   ├── server.ts         (server: aggregate API 端點，Phase 2)
│   ├── entities/
│   │   ├── Dashboard.ts
│   │   ├── DashboardWidget.ts
│   │   └── DashboardController.ts
│   ├── module.ts
│   └── types.ts          (IWidgetDataSource, IPermissionEntry, IWidgetProps)
│
plugins/system/src/
│   ├── dashboard/
│   │   ├── DashboardListView.tsx     (卡片式清單)
│   │   ├── DashboardCanvas.tsx       (檢視 + 編輯模式)
│   │   ├── WidgetRenderer.tsx        (根據 widgetType → PluginRegistry 解析)
│   │   ├── WidgetConfigDrawer.tsx    (widget 設定面板)
│   │   ├── DashboardNav.tsx          (sidebar slot)
│   │   └── resolveWidgetData.ts      (資料取得邏輯)
│   └── widgets/
│       ├── KpiCardWidget.tsx
│       ├── BarChartWidget.tsx
│       ├── LineChartWidget.tsx
│       ├── PieChartWidget.tsx
│       ├── DataTableWidget.tsx
│       └── MarkdownWidget.tsx
```

---

## 十二、Dependencies

| Package | Where | Purpose |
|---|---|---|
| `recharts` | plugins/system (peerDep) or app | 圖表渲染 |
| `react-grid-layout` | plugins/system | 拖曳 + resize 佈局 |
| `@types/react-grid-layout` | devDependencies | TypeScript 型別 |

---

## 十三、實作順序（Milestones）

### Phase 1 — 基礎 CRUD + 檢視

1. **packages/dashboard entities**：Dashboard、DashboardWidget、types
2. **DashboardModule**：defineModule、註冊到 app
3. **DashboardListView**：卡片清單 + 新增/刪除
4. **DashboardCanvas (view mode)**：CSS Grid 渲染 widgets
5. **resolveWidgetData**：entity 查詢 + 前端聚合
6. **Widget plugins (4 種)**：kpi-card、bar-chart、pie-chart、data-table
7. **DashboardNav sidebar slot**：動態顯示使用者可見的 dashboards
8. **路由整合**：`/dashboards` + `/dashboards/:id` 全域路由

**交付物：** 管理者可手動建立 Dashboard + Widget，所有使用者按權限檢視。

### Phase 2 — 編輯模式 + 拖曳

1. **react-grid-layout 整合**：DashboardCanvas edit mode
2. **WidgetConfigDrawer**：widget 設定面板 (data source + type-specific config)
3. **permission-picker control**：角色/使用者混合選擇器
4. **Line chart + Markdown widget**
5. **Dashboard duplicate action**

**交付物：** 有編輯權限的使用者可拖曳調整佈局、新增/設定 widgets。

### Phase 3 — AI 整合

1. **generate_widget_config tool**：AI 可分析 entity schema 並建議 widget 配置
2. **AI context awareness**：在 dashboard 頁面時，AI 知道正在看哪個 dashboard
3. **自然語言建立整個 dashboard**：AI 透過多次 tool call 建立 dashboard + widgets

**交付物：** 使用者可用自然語言「幫我建一個銷售 dashboard」。

### Phase 4 — 進階（可選）

1. 後端聚合 API（大量資料場景）
2. 自動刷新（可設定 refresh interval）
3. Dashboard 匯出（PDF / 圖片）
4. Widget 全螢幕展開
5. 日期範圍篩選器（全域 filter 套用到所有 widgets）

---

## 十四、與現有架構的整合點

| 面向 | 整合方式 |
|---|---|
| Entity 體系 | Dashboard / DashboardWidget 用 `@iEntity` + `@iField.*`，遵循 BaseObject |
| RBAC | `allowedRoles` 用 row-level predicate，結合 `viewPermissions` / `editPermissions` JSON 欄位 |
| Plugin 體系 | Widget 類型註冊為 `PluginRegistry("widget", ...)`；DashboardListView / DashboardCanvas 註冊為 list-view / detail-view |
| Sidebar | `sidebar-header:dashboards` slot 動態渲染 |
| AI Panel | 現有 `create_record` / `update_record` 直接操作 Dashboard entities；新增 `generate_widget_config` tool |
| EventBus | AI 寫入 dashboard-widgets 後，`data_changed` 事件讓 DashboardCanvas 自動刷新 |
| i18n | DashboardModule 提供 zh-TW 翻譯 |
| 路由 | 全域路由 `/dashboards` 和 `/dashboards/:id`，不走 module 路由 |
