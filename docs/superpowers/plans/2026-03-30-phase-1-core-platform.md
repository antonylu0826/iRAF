# Phase 1 — 核心底座 (Core Platform) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `@iraf/core` 實作框架的四個核心元素：`BaseObject`（稽核欄位基底類別）、`@iEntity`（BO 實體 decorator）、`@iField.*`（欄位 decorator）、`EntityRegistry`（實體登記簿），並在 `apps/demo` 建立第一個 BO（Customer）與最小化 Remult Express 後端。

**Architecture:** `@iField.*` 包裹 Remult 的 `@Fields.*` 並透過 `Reflect.defineMetadata` 儲存 iRAF UI metadata；`@iEntity` 包裹 Remult 的 `@Entity` 並注入稽核欄位自動填寫的 saving hook；`EntityRegistry` 是靜態登記簿，驅動後續 UI 導航與視圖生成。所有 BO 繼承 `BaseObject`。

**Tech Stack:** TypeScript 5 · Remult 0.27 · reflect-metadata · @paralleldrive/cuid2 · @swc/core (tsup 的 emitDecoratorMetadata 支援) · Express · Vitest · InMemoryDataProvider (測試用)

---

## 檔案結構總覽

```
packages/core/src/
├── types/
│   └── metadata.ts              # 所有 TypeScript 介面與 Symbol key 定義
├── decorators/
│   ├── iField.ts                # @iField.* 命名空間 (string/number/date/boolean)
│   └── iEntity.ts               # @iEntity 工廠函式
├── base/
│   └── BaseObject.ts            # 抽象基底類別（id/createdAt/updatedAt/createdBy/updatedBy）
├── registry/
│   └── EntityRegistry.ts        # 靜態實體登記簿
├── __tests__/
│   ├── index.test.ts            # (已存在，Phase 0 smoke test)
│   ├── iField.test.ts           # 新增
│   ├── iEntity.test.ts          # 新增
│   ├── BaseObject.test.ts       # 新增
│   ├── EntityRegistry.test.ts   # 新增
│   └── integration.test.ts      # 新增（Remult InMemoryDataProvider 端到端測試）
└── index.ts                     # 更新：export 全部公開 API + import reflect-metadata

apps/demo/src/
├── shared/
│   ├── entities/
│   │   └── Customer.ts          # 第一個 BO
│   └── index.ts                 # EntityRegistry.register(Customer)
└── server/
    └── index.ts                 # Express + remultExpress 後端
```

---

## Task 1：安裝 Phase 1 依賴

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/core/tsup.config.ts`
- Modify: `apps/demo/package.json`

- [ ] **Step 1: 更新 packages/core/package.json — 加入新依賴**

將 `packages/core/package.json` 的 `dependencies` 和 `devDependencies` 更新為：

```json
{
  "name": "@iraf/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "@paralleldrive/cuid2": "^2.2.2",
    "reflect-metadata": "^0.2.0",
    "remult": "^0.27.0"
  },
  "devDependencies": {
    "@swc/core": "^1.7.0",
    "tsup": "^8.0.0"
  }
}
```

- [ ] **Step 2: 更新 packages/core/tsup.config.ts — 移除 experimentalDts: false**

`@swc/core` 安裝後，tsup 會自動用 SWC 處理 `emitDecoratorMetadata`，Phase 0 的 workaround 可以移除：

```ts
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  esbuildOptions(options) {
    options.keepNames = true
  },
})
```

- [ ] **Step 3: 更新 apps/demo/package.json — 加入 express**

在 `apps/demo/package.json` 的 `dependencies` 加入：

```json
"dependencies": {
  "@iraf/core": "*",
  "@iraf/react": "*",
  "express": "^4.21.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router": "^7.0.0",
  "remult": "^0.27.0",
  "lucide-react": "^0.400.0"
}
```

在 `devDependencies` 加入：
```json
"@types/express": "^4.17.0"
```

- [ ] **Step 4: 安裝所有依賴**

```bash
cd "c:/Users/Anthony.MAXECHO/Desktop/iRAF"
npm install
```

預期：無 error。`@swc/core`、`reflect-metadata`、`@paralleldrive/cuid2`、`express` 全部安裝成功。

- [ ] **Step 5: 確認 @swc/core 可用**

```bash
npm run build --workspace=packages/core
```

預期：tsup build 成功，且不再出現 `skipping swc plugin` 的警告。

- [ ] **Step 6: Commit**

```bash
git add packages/core/package.json packages/core/tsup.config.ts apps/demo/package.json package-lock.json
git commit -m "chore(core): add reflect-metadata, @swc/core, cuid2; add express to demo"
```

---

## Task 2：Metadata 類型定義

**Files:**
- Create: `packages/core/src/types/metadata.ts`

- [ ] **Step 1: 建立 packages/core/src/types/metadata.ts**

```ts
// packages/core/src/types/metadata.ts

// ─── Symbol keys ─────────────────────────────────────────────────────────────
/** iRAF 欄位 UI metadata 的 Reflect key */
export const IRAF_FIELD_KEY = Symbol("iraf:field")

/** iRAF 實體 metadata 的 Reflect key */
export const IRAF_ENTITY_KEY = Symbol("iraf:entity")

// ─── Field metadata ───────────────────────────────────────────────────────────

/** iRAF 欄位 UI hints（儲存於 Reflect metadata，不傳給 Remult） */
export interface IFieldMeta {
  group?: string
  readOnly?: boolean
  hidden?: boolean
  order?: number
  displayFormat?: string
}

/** @iField.string / @iField.number 等的選項 */
export interface IFieldOptions extends IFieldMeta {
  caption?: string
  required?: boolean
}

// ─── Entity metadata ──────────────────────────────────────────────────────────

/** @iEntity 的選項（傳入 decorator 的參數） */
export interface IEntityOptions {
  caption: string
  icon?: string
  module?: string
  defaultOrder?: Record<string, "asc" | "desc">
  allowApiCrud?: boolean
  saving?: (entity: any, event: { isNew: boolean }) => Promise<void> | void
}

/** 儲存於 Reflect metadata 的實體資訊（去掉 saving hook） */
export interface IEntityMeta {
  key: string
  caption: string
  icon?: string
  module?: string
  defaultOrder?: Record<string, "asc" | "desc">
}
```

- [ ] **Step 2: 建立對應的 `__tests__` 目錄**

```bash
mkdir -p "packages/core/src/__tests__"
```

（目錄已在 Phase 0 建立，此步驟確保存在）

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/types/
git commit -m "feat(core): add metadata types and symbol keys"
```

---

## Task 3：`@iField.*` Decorator

**Files:**
- Create: `packages/core/src/decorators/iField.ts`
- Create: `packages/core/src/__tests__/iField.test.ts`

- [ ] **Step 1: 建立測試檔（先讓測試失敗）**

建立 `packages/core/src/__tests__/iField.test.ts`：

```ts
import "reflect-metadata"
import { describe, it, expect } from "vitest"
import { IRAF_FIELD_KEY, type IFieldMeta } from "../types/metadata"
import { iField } from "../decorators/iField"

describe("iField.string", () => {
  it("stores group in iRAF field metadata", () => {
    class TestEntity {
      @iField.string({ caption: "姓名", group: "基本資訊" })
      name = ""
    }
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, TestEntity) ?? {}
    expect(meta["name"]).toEqual({ group: "基本資訊" })
  })

  it("stores readOnly and hidden flags", () => {
    class TestEntity {
      @iField.string({ readOnly: true, hidden: true })
      createdBy = ""
    }
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, TestEntity) ?? {}
    expect(meta["createdBy"]).toEqual({ readOnly: true, hidden: true })
  })

  it("stores no iRAF metadata when no options given", () => {
    class TestEntity {
      @iField.string({ caption: "描述" })
      description = ""
    }
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, TestEntity) ?? {}
    expect(meta["description"]).toEqual({})
  })

  it("accumulates metadata for multiple fields", () => {
    class TestEntity {
      @iField.string({ group: "A" })
      fieldA = ""

      @iField.string({ group: "B" })
      fieldB = ""
    }
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, TestEntity) ?? {}
    expect(meta["fieldA"]?.group).toBe("A")
    expect(meta["fieldB"]?.group).toBe("B")
  })
})

describe("iField.number", () => {
  it("stores order in iRAF field metadata", () => {
    class TestEntity {
      @iField.number({ caption: "金額", order: 2 })
      amount = 0
    }
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, TestEntity) ?? {}
    expect(meta["amount"]).toEqual({ order: 2 })
  })
})

describe("iField.date", () => {
  it("stores hidden flag", () => {
    class TestEntity {
      @iField.date({ hidden: true })
      createdAt?: Date
    }
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, TestEntity) ?? {}
    expect(meta["createdAt"]).toEqual({ hidden: true })
  })
})

describe("iField.boolean", () => {
  it("stores readOnly flag", () => {
    class TestEntity {
      @iField.boolean({ readOnly: true })
      isActive = true
    }
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, TestEntity) ?? {}
    expect(meta["isActive"]).toEqual({ readOnly: true })
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
cd "c:/Users/Anthony.MAXECHO/Desktop/iRAF"
npm test
```

預期：`iField.test.ts` 全部失敗，錯誤類似 `Cannot find module '../decorators/iField'`。

- [ ] **Step 3: 建立 packages/core/src/decorators/iField.ts**

先建立目錄：
```bash
mkdir -p packages/core/src/decorators
```

然後建立 `packages/core/src/decorators/iField.ts`：

```ts
import "reflect-metadata"
import { Fields, Validators } from "remult"
import { IRAF_FIELD_KEY, type IFieldMeta, type IFieldOptions } from "../types/metadata"

// ─── 內部工具函式 ──────────────────────────────────────────────────────────────

/** 從 IFieldOptions 中取出 iRAF UI hints（排除 caption 和 required） */
function extractFieldMeta(options: IFieldOptions): IFieldMeta {
  const meta: IFieldMeta = {}
  if (options.group !== undefined) meta.group = options.group
  if (options.readOnly !== undefined) meta.readOnly = options.readOnly
  if (options.hidden !== undefined) meta.hidden = options.hidden
  if (options.order !== undefined) meta.order = options.order
  if (options.displayFormat !== undefined) meta.displayFormat = options.displayFormat
  return meta
}

/** 將 iRAF 欄位 metadata 附加到類別的 Reflect metadata 上 */
function storeFieldMeta(
  target: object,
  propertyKey: string | symbol,
  meta: IFieldMeta
): void {
  const ctor = (target as any).constructor as Function
  const existing: Record<string | symbol, IFieldMeta> =
    Reflect.getOwnMetadata(IRAF_FIELD_KEY, ctor) ?? {}
  existing[propertyKey as string] = meta
  Reflect.defineMetadata(IRAF_FIELD_KEY, existing, ctor)
}

// ─── @iField namespace ────────────────────────────────────────────────────────

export const iField = {
  /**
   * 字串欄位。包裹 Remult `@Fields.string()`。
   * @param options caption（傳給 Remult）、required（傳給 Remult validator）
   *                group/readOnly/hidden/order/displayFormat（iRAF UI metadata）
   */
  string(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.string({
        caption: options.caption,
        ...(options.required ? { validate: Validators.required } : {}),
      })(target, propertyKey)
      storeFieldMeta(target, propertyKey, extractFieldMeta(options))
    }
  },

  /**
   * 數字欄位。包裹 Remult `@Fields.number()`。
   */
  number(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.number({
        caption: options.caption,
        ...(options.required ? { validate: Validators.required } : {}),
      })(target, propertyKey)
      storeFieldMeta(target, propertyKey, extractFieldMeta(options))
    }
  },

  /**
   * 日期欄位。包裹 Remult `@Fields.date()`。
   */
  date(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.date({
        caption: options.caption,
        ...(options.required ? { validate: Validators.required } : {}),
      })(target, propertyKey)
      storeFieldMeta(target, propertyKey, extractFieldMeta(options))
    }
  },

  /**
   * 布林欄位。包裹 Remult `@Fields.boolean()`。
   */
  boolean(options: IFieldOptions = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
      Fields.boolean({
        caption: options.caption,
      })(target, propertyKey)
      storeFieldMeta(target, propertyKey, extractFieldMeta(options))
    }
  },
}
```

- [ ] **Step 4: 執行測試，確認通過**

```bash
npm test
```

預期：`iField.test.ts` 全部通過（加上 Phase 0 的 2 個 smoke test）。

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/decorators/iField.ts packages/core/src/__tests__/iField.test.ts
git commit -m "feat(core): implement @iField.* decorator with Remult field wrapping"
```

---

## Task 4：`@iEntity` Decorator

**Files:**
- Create: `packages/core/src/decorators/iEntity.ts`
- Create: `packages/core/src/__tests__/iEntity.test.ts`

- [ ] **Step 1: 建立測試檔**

建立 `packages/core/src/__tests__/iEntity.test.ts`：

```ts
import "reflect-metadata"
import { describe, it, expect } from "vitest"
import { IRAF_ENTITY_KEY, type IEntityMeta } from "../types/metadata"
import { iEntity } from "../decorators/iEntity"

describe("iEntity", () => {
  it("stores caption in iRAF entity metadata", () => {
    @iEntity("test_customers", {
      caption: "客戶",
      icon: "Users",
      module: "銷售",
      allowApiCrud: true,
    })
    class TestCustomer {
      id = ""
      name = ""
    }
    const meta: IEntityMeta = Reflect.getMetadata(IRAF_ENTITY_KEY, TestCustomer)
    expect(meta.caption).toBe("客戶")
  })

  it("stores icon in iRAF entity metadata", () => {
    @iEntity("test_products", {
      caption: "產品",
      icon: "Package",
      module: "庫存",
      allowApiCrud: true,
    })
    class TestProduct {
      id = ""
    }
    const meta: IEntityMeta = Reflect.getMetadata(IRAF_ENTITY_KEY, TestProduct)
    expect(meta.icon).toBe("Package")
    expect(meta.module).toBe("庫存")
  })

  it("stores entity key in iRAF entity metadata", () => {
    @iEntity("test_orders", {
      caption: "訂單",
      allowApiCrud: true,
    })
    class TestOrder {
      id = ""
    }
    const meta: IEntityMeta = Reflect.getMetadata(IRAF_ENTITY_KEY, TestOrder)
    expect(meta.key).toBe("test_orders")
  })

  it("does not store saving hook in metadata", () => {
    @iEntity("test_items", {
      caption: "項目",
      allowApiCrud: true,
      saving: async () => {},
    })
    class TestItem {
      id = ""
    }
    const meta: IEntityMeta = Reflect.getMetadata(IRAF_ENTITY_KEY, TestItem)
    expect((meta as any).saving).toBeUndefined()
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npm test
```

預期：`iEntity.test.ts` 全部失敗，錯誤 `Cannot find module '../decorators/iEntity'`。

- [ ] **Step 3: 建立 packages/core/src/decorators/iEntity.ts**

```ts
import "reflect-metadata"
import { Entity, remult } from "remult"
import { IRAF_ENTITY_KEY, type IEntityMeta, type IEntityOptions } from "../types/metadata"

/**
 * @iEntity — iRAF 實體 decorator。
 *
 * 包裹 Remult 的 @Entity，並：
 * 1. 注入 saving hook，自動填寫 BaseObject 的稽核欄位
 * 2. 將 iRAF metadata（caption、icon、module 等）儲存至 Reflect metadata
 *
 * @param key    Remult 實體 key（對應資料庫表名或 API 路徑）
 * @param options iRAF 實體選項
 */
export function iEntity(key: string, options: IEntityOptions) {
  return (target: Function): void => {
    const {
      caption,
      icon,
      module: mod,
      defaultOrder,
      allowApiCrud = true,
      saving: userSaving,
    } = options

    // 1. 儲存 iRAF metadata（不含 saving hook）
    const irafMeta: IEntityMeta = { key, caption, icon, module: mod, defaultOrder }
    Reflect.defineMetadata(IRAF_ENTITY_KEY, irafMeta, target)

    // 2. 套用 Remult 的 @Entity，注入 saving hook 自動填寫稽核欄位
    Entity(key, {
      allowApiCrud,
      saving: async (entity: any, e: { isNew: boolean }) => {
        if (e.isNew) {
          entity.createdAt = new Date()
          entity.createdBy = remult.user?.name ?? ""
        }
        entity.updatedAt = new Date()
        entity.updatedBy = remult.user?.name ?? ""
        await userSaving?.(entity, e)
      },
    })(target)
  }
}
```

- [ ] **Step 4: 執行測試，確認通過**

```bash
npm test
```

預期：`iEntity.test.ts` 全部通過。

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/decorators/iEntity.ts packages/core/src/__tests__/iEntity.test.ts
git commit -m "feat(core): implement @iEntity decorator with Remult entity wrapping and saving hook"
```

---

## Task 5：`BaseObject`

**Files:**
- Create: `packages/core/src/base/BaseObject.ts`
- Create: `packages/core/src/__tests__/BaseObject.test.ts`

- [ ] **Step 1: 建立測試檔**

建立 `packages/core/src/__tests__/BaseObject.test.ts`：

```ts
import "reflect-metadata"
import { describe, it, expect } from "vitest"
import { IRAF_FIELD_KEY, type IFieldMeta } from "../types/metadata"
import { BaseObject } from "../base/BaseObject"

describe("BaseObject", () => {
  it("defines createdAt field with hidden metadata", () => {
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, BaseObject) ?? {}
    expect(meta["createdAt"]?.hidden).toBe(true)
  })

  it("defines updatedAt field with hidden metadata", () => {
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, BaseObject) ?? {}
    expect(meta["updatedAt"]?.hidden).toBe(true)
  })

  it("defines createdBy field with hidden and readOnly metadata", () => {
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, BaseObject) ?? {}
    expect(meta["createdBy"]?.hidden).toBe(true)
    expect(meta["createdBy"]?.readOnly).toBe(true)
  })

  it("defines updatedBy field with hidden and readOnly metadata", () => {
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, BaseObject) ?? {}
    expect(meta["updatedBy"]?.hidden).toBe(true)
    expect(meta["updatedBy"]?.readOnly).toBe(true)
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npm test
```

預期：`BaseObject.test.ts` 全部失敗，錯誤 `Cannot find module '../base/BaseObject'`。

- [ ] **Step 3: 建立 packages/core/src/base/BaseObject.ts**

先建立目錄：
```bash
mkdir -p packages/core/src/base
```

然後建立 `packages/core/src/base/BaseObject.ts`：

```ts
import "reflect-metadata"
import { Fields } from "remult"
import { iField } from "../decorators/iField"

/**
 * BaseObject — 所有 iRAF 業務實體的抽象基底類別。
 *
 * 提供：
 * - `id`：cuid 格式的主鍵，由 Remult 自動生成
 * - `createdAt` / `updatedAt`：由 @iEntity saving hook 自動填寫
 * - `createdBy` / `updatedBy`：由 @iEntity saving hook 自動填寫（remult.user.name）
 *
 * 使用方式：
 * ```ts
 * @iEntity("customers", { caption: "客戶", icon: "Users", module: "銷售" })
 * export class Customer extends BaseObject {
 *   @iField.string({ caption: "姓名", required: true })
 *   name = ""
 * }
 * ```
 */
export abstract class BaseObject {
  @Fields.cuid()
  id = ""

  @iField.date({ caption: "建立時間", readOnly: true, hidden: true })
  createdAt?: Date

  @iField.date({ caption: "更新時間", readOnly: true, hidden: true })
  updatedAt?: Date

  @iField.string({ caption: "建立者", readOnly: true, hidden: true })
  createdBy = ""

  @iField.string({ caption: "更新者", readOnly: true, hidden: true })
  updatedBy = ""
}
```

- [ ] **Step 4: 執行測試，確認通過**

```bash
npm test
```

預期：`BaseObject.test.ts` 全部通過。

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/base/BaseObject.ts packages/core/src/__tests__/BaseObject.test.ts
git commit -m "feat(core): implement BaseObject with audit fields"
```

---

## Task 6：`EntityRegistry`

**Files:**
- Create: `packages/core/src/registry/EntityRegistry.ts`
- Create: `packages/core/src/__tests__/EntityRegistry.test.ts`

- [ ] **Step 1: 建立測試檔**

建立 `packages/core/src/__tests__/EntityRegistry.test.ts`：

```ts
import "reflect-metadata"
import { describe, it, expect, beforeEach } from "vitest"
import { iEntity } from "../decorators/iEntity"
import { iField } from "../decorators/iField"
import { BaseObject } from "../base/BaseObject"
import { EntityRegistry } from "../registry/EntityRegistry"

// 測試用 BO（每個測試重新建立）
function makeTestEntities() {
  @iEntity("reg_customers", { caption: "客戶", icon: "Users", module: "銷售", allowApiCrud: true })
  class RegCustomer extends BaseObject {
    @iField.string({ caption: "姓名", required: true })
    name = ""
  }

  @iEntity("reg_products", { caption: "產品", icon: "Package", module: "庫存", allowApiCrud: true })
  class RegProduct extends BaseObject {
    @iField.string({ caption: "品名" })
    productName = ""
  }

  return { RegCustomer, RegProduct }
}

describe("EntityRegistry", () => {
  beforeEach(() => {
    EntityRegistry.clear()
  })

  it("registers a single entity", () => {
    const { RegCustomer } = makeTestEntities()
    EntityRegistry.register(RegCustomer)
    expect(EntityRegistry.getAll()).toHaveLength(1)
    expect(EntityRegistry.getAll()[0]).toBe(RegCustomer)
  })

  it("registers multiple entities at once", () => {
    const { RegCustomer, RegProduct } = makeTestEntities()
    EntityRegistry.register(RegCustomer, RegProduct)
    expect(EntityRegistry.getAll()).toHaveLength(2)
  })

  it("does not register duplicates", () => {
    const { RegCustomer } = makeTestEntities()
    EntityRegistry.register(RegCustomer)
    EntityRegistry.register(RegCustomer)
    expect(EntityRegistry.getAll()).toHaveLength(1)
  })

  it("returns iRAF entity metadata via getMeta", () => {
    const { RegCustomer } = makeTestEntities()
    EntityRegistry.register(RegCustomer)
    const meta = EntityRegistry.getMeta(RegCustomer)
    expect(meta?.caption).toBe("客戶")
    expect(meta?.icon).toBe("Users")
    expect(meta?.module).toBe("銷售")
    expect(meta?.key).toBe("reg_customers")
  })

  it("returns iRAF field metadata via getFieldMeta", () => {
    const { RegCustomer } = makeTestEntities()
    EntityRegistry.register(RegCustomer)
    const fieldMeta = EntityRegistry.getFieldMeta(RegCustomer)
    expect(fieldMeta["name"]).toEqual({})
  })

  it("clear() empties the registry", () => {
    const { RegCustomer } = makeTestEntities()
    EntityRegistry.register(RegCustomer)
    EntityRegistry.clear()
    expect(EntityRegistry.getAll()).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npm test
```

預期：`EntityRegistry.test.ts` 全部失敗，錯誤 `Cannot find module '../registry/EntityRegistry'`。

- [ ] **Step 3: 建立 packages/core/src/registry/EntityRegistry.ts**

先建立目錄：
```bash
mkdir -p packages/core/src/registry
```

然後建立 `packages/core/src/registry/EntityRegistry.ts`：

```ts
import { IRAF_ENTITY_KEY, IRAF_FIELD_KEY, type IEntityMeta, type IFieldMeta } from "../types/metadata"

/**
 * EntityRegistry — iRAF 實體登記簿。
 *
 * 所有 BO 必須在此登記，框架才能：
 * - 生成左側導航選單
 * - 為每個實體建立 ListView / DetailView 路由
 * - 套用權限控制
 *
 * 使用方式：
 * ```ts
 * // apps/demo/src/shared/index.ts
 * EntityRegistry.register(Customer, Order, Product)
 * ```
 */
export class EntityRegistry {
  private static _entities: Function[] = []

  /** 登記一或多個 BO。重複登記同一個 class 會被忽略。 */
  static register(...entities: Function[]): void {
    for (const entity of entities) {
      if (!this._entities.includes(entity)) {
        this._entities.push(entity)
      }
    }
  }

  /** 取得所有已登記的 BO class。 */
  static getAll(): Function[] {
    return [...this._entities]
  }

  /**
   * 取得指定 BO 的 iRAF 實體 metadata（caption、icon、module 等）。
   * 若該 class 未以 @iEntity 裝飾，回傳 undefined。
   */
  static getMeta(entityClass: Function): IEntityMeta | undefined {
    return Reflect.getMetadata(IRAF_ENTITY_KEY, entityClass)
  }

  /**
   * 取得指定 BO 所有欄位的 iRAF 欄位 metadata（group、readOnly、hidden 等）。
   * 若無 metadata，回傳空物件。
   */
  static getFieldMeta(entityClass: Function): Record<string, IFieldMeta> {
    return Reflect.getOwnMetadata(IRAF_FIELD_KEY, entityClass) ?? {}
  }

  /** 清除所有登記（主要用於測試）。 */
  static clear(): void {
    this._entities = []
  }
}
```

- [ ] **Step 4: 執行測試，確認通過**

```bash
npm test
```

預期：所有測試通過（Phase 0 的 2 個 + Task 3 的 4 個 + Task 4 的 4 個 + Task 5 的 4 個 + Task 6 的 6 個 = 20 個）。

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/registry/EntityRegistry.ts packages/core/src/__tests__/EntityRegistry.test.ts
git commit -m "feat(core): implement EntityRegistry with register/getMeta/getFieldMeta/clear"
```

---

## Task 7：更新 `packages/core/src/index.ts` + 建置

**Files:**
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: 更新 packages/core/src/index.ts**

```ts
// @iraf/core — iRAF Framework Core
// import reflect-metadata once here — 所有使用 @iraf/core 的應用程式都會自動載入
import "reflect-metadata"

// ─── 版本 ──────────────────────────────────────────────────────────────────────
export const IRAF_VERSION = "0.1.0"

// ─── 類型定義 ──────────────────────────────────────────────────────────────────
export type { IEntityOptions, IEntityMeta, IFieldOptions, IFieldMeta } from "./types/metadata"
export { IRAF_ENTITY_KEY, IRAF_FIELD_KEY } from "./types/metadata"

// ─── Decorators ───────────────────────────────────────────────────────────────
export { iField } from "./decorators/iField"
export { iEntity } from "./decorators/iEntity"

// ─── Base ─────────────────────────────────────────────────────────────────────
export { BaseObject } from "./base/BaseObject"

// ─── Registry ─────────────────────────────────────────────────────────────────
export { EntityRegistry } from "./registry/EntityRegistry"
```

- [ ] **Step 2: 更新 packages/core/src/__tests__/index.test.ts**

版本號已從 "0.0.1" 改為 "0.1.0"，需更新 smoke test：

```ts
import { describe, it, expect } from "vitest"
import { IRAF_VERSION } from "../index"

describe("@iraf/core", () => {
  it("exports a version string", () => {
    expect(IRAF_VERSION).toBe("0.1.0")
  })
})
```

- [ ] **Step 3: 執行測試，確認全部通過**

```bash
npm test
```

預期：所有測試通過。

- [ ] **Step 4: 重新建置 packages/core**

```bash
npm run build --workspace=packages/core
```

預期：建置成功，dist/ 更新。

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/index.ts packages/core/src/__tests__/index.test.ts
git commit -m "feat(core): export full public API, bump to 0.1.0"
```

---

## Task 8：整合測試（InMemoryDataProvider）

**Files:**
- Create: `packages/core/src/__tests__/integration.test.ts`

此 Task 驗證：
1. `@iEntity` 的 saving hook 確實自動填寫 BaseObject 稽核欄位
2. `required: true` 的欄位驗證在 save 時生效
3. 整個框架與 Remult 正確整合

- [ ] **Step 1: 建立測試檔**

建立 `packages/core/src/__tests__/integration.test.ts`：

```ts
import "reflect-metadata"
import { describe, it, expect, beforeEach } from "vitest"
import { remult, InMemoryDataProvider } from "remult"
import { iEntity } from "../decorators/iEntity"
import { iField } from "../decorators/iField"
import { BaseObject } from "../base/BaseObject"

// ─── 測試用 BO ─────────────────────────────────────────────────────────────────
@iEntity("integ_customers", {
  caption: "整合測試客戶",
  allowApiCrud: true,
})
class IntegCustomer extends BaseObject {
  @iField.string({ caption: "姓名", required: true })
  name = ""

  @iField.string({ caption: "電話", group: "聯絡資訊" })
  phone = ""
}

// ─── 測試 ─────────────────────────────────────────────────────────────────────
describe("BaseObject + @iEntity integration", () => {
  beforeEach(() => {
    remult.dataProvider = new InMemoryDataProvider()
  })

  it("auto-generates a non-empty id on insert", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "王小明" })
    expect(customer.id).toBeTruthy()
    expect(customer.id.length).toBeGreaterThan(0)
  })

  it("auto-fills createdAt on insert", async () => {
    const before = new Date()
    const customer = await remult.repo(IntegCustomer).insert({ name: "王小明" })
    const after = new Date()
    expect(customer.createdAt).toBeInstanceOf(Date)
    expect(customer.createdAt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(customer.createdAt!.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it("auto-fills updatedAt on insert", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "王小明" })
    expect(customer.updatedAt).toBeInstanceOf(Date)
  })

  it("auto-fills updatedAt on update", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "王小明" })
    const original = customer.updatedAt!.getTime()

    // 等待 1ms 確保時間差異
    await new Promise((r) => setTimeout(r, 1))

    const updated = await remult.repo(IntegCustomer).save({
      ...customer,
      phone: "0912345678",
    })
    expect(updated.updatedAt!.getTime()).toBeGreaterThanOrEqual(original)
  })

  it("createdAt does not change on update", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "王小明" })
    const originalCreatedAt = customer.createdAt!.getTime()

    await new Promise((r) => setTimeout(r, 1))

    const updated = await remult.repo(IntegCustomer).save({
      ...customer,
      phone: "0912345678",
    })
    expect(updated.createdAt!.getTime()).toBe(originalCreatedAt)
  })

  it("throws validation error when required field is empty", async () => {
    await expect(
      remult.repo(IntegCustomer).insert({ name: "" })
    ).rejects.toThrow()
  })

  it("can find a saved entity by id", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "李四" })
    const found = await remult.repo(IntegCustomer).findId(customer.id)
    expect(found?.name).toBe("李四")
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npm test
```

預期：`integration.test.ts` 全部失敗（因為 `packages/core/src/decorators/iField.ts` 等已存在，錯誤應來自測試邏輯本身）。若出現 `InMemoryDataProvider is not exported from 'remult'`，請確認 remult 版本是否為 0.27+：
```bash
cat packages/core/node_modules/remult/package.json | grep '"version"'
```
`InMemoryDataProvider` 在 Remult v0.27 中直接從 `"remult"` 匯出，是官方文件記載的 API。

- [ ] **Step 3: 執行測試，確認全部通過**

```bash
npm test
```

預期：所有測試通過，包含 7 個整合測試。

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/__tests__/integration.test.ts
git commit -m "test(core): add integration tests for BaseObject audit fields and @iEntity saving hook"
```

---

## Task 9：Demo — Customer BO + Express 後端

**Files:**
- Create: `apps/demo/src/shared/entities/Customer.ts`
- Create: `apps/demo/src/shared/index.ts`
- Create: `apps/demo/src/server/index.ts`
- Modify: `apps/demo/package.json` (加入 server 啟動 script)

- [ ] **Step 1: 建立目錄結構**

```bash
mkdir -p apps/demo/src/shared/entities
mkdir -p apps/demo/src/server
```

- [ ] **Step 2: 建立 apps/demo/src/shared/entities/Customer.ts**

```ts
// apps/demo/src/shared/entities/Customer.ts
import { iEntity, iField, BaseObject } from "@iraf/core"

/**
 * Customer — iRAF Demo 的第一個 Business Object。
 * 示範 @iEntity / @iField 的標準使用方式。
 */
@iEntity("customers", {
  caption: "客戶",
  icon: "Users",
  module: "銷售",
  allowApiCrud: true,
})
export class Customer extends BaseObject {
  @iField.string({ caption: "姓名", required: true })
  name = ""

  @iField.string({ caption: "電話", group: "聯絡資訊" })
  phone = ""

  @iField.string({ caption: "Email", group: "聯絡資訊" })
  email = ""
}
```

- [ ] **Step 3: 建立 apps/demo/src/shared/index.ts**

```ts
// apps/demo/src/shared/index.ts
// 所有 BO 在此登記 — 匯入此檔案即可觸發登記
import { EntityRegistry } from "@iraf/core"
import { Customer } from "./entities/Customer"

EntityRegistry.register(Customer)

export { Customer }
```

- [ ] **Step 4: 建立 apps/demo/src/server/index.ts**

```ts
// apps/demo/src/server/index.ts
import express from "express"
import { remultExpress } from "remult/remult-express"
import { Customer } from "../shared/entities/Customer"

const app = express()

app.use(
  remultExpress({
    entities: [Customer],
    // Phase 1 使用 InMemoryDataProvider（預設），資料不持久化
    // Phase 4 會換成 SQLite/PostgreSQL
  })
)

app.get("/", (_req, res) => {
  res.json({ status: "iRAF Demo Server running", version: "0.1.0" })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`iRAF Demo Server started on http://localhost:${PORT}`)
  console.log(`Customer API: http://localhost:${PORT}/api/customers`)
})
```

- [ ] **Step 5: 更新 apps/demo/package.json 加入 server script**

在 `scripts` 區塊加入：
```json
"scripts": {
  "dev": "vite",
  "dev:server": "node --experimental-vm-modules --loader ts-node/esm src/server/index.ts",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview"
}
```

> **注意：** 若 `ts-node` 不在 devDeps，改用 `tsx`：
> 在 `devDependencies` 加入 `"tsx": "^4.0.0"`，script 改為 `"tsx src/server/index.ts"`。

- [ ] **Step 6: 安裝 tsx**

```bash
npm install --workspace=apps/demo tsx --save-dev
npm install
```

然後確認 apps/demo/package.json 的 `dev:server` script 為：
```json
"dev:server": "tsx src/server/index.ts"
```

- [ ] **Step 7: 驗證 demo app 仍可建置**

```bash
npm run build --workspace=apps/demo
```

預期：Vite build 成功（server/ 目錄不影響前端建置）。

- [ ] **Step 8: 執行所有測試確認無破壞**

```bash
npm test
```

預期：所有測試通過。

- [ ] **Step 9: Commit**

```bash
git add apps/demo/src/shared/ apps/demo/src/server/ apps/demo/package.json package-lock.json
git commit -m "feat(demo): add Customer BO, EntityRegistry setup, and Express server"
```

---

## Phase 1 完成標準

- [ ] `npm test` 全部通過（含 7 個整合測試）
- [ ] `npm run build --workspace=packages/core` 無警告（@swc/core 安裝後無 skipping swc plugin）
- [ ] `npm run build --workspace=apps/demo` 成功
- [ ] `packages/core` 匯出：`iEntity`、`iField`、`BaseObject`、`EntityRegistry`、所有 types
- [ ] `apps/demo` 有 Customer BO + Express server 可啟動

完成後進入 **Phase 2 — UI 引擎 MVP**（App Shell、ListView 自動渲染、DetailView 自動渲染）。

---

## 附錄：@swc/core 問題排查

若 `npm run build --workspace=packages/core` 仍出現 `skipping swc plugin` 警告：

1. 確認 `@swc/core` 已安裝在 `packages/core/node_modules`：
   ```bash
   ls packages/core/node_modules/@swc/ 2>/dev/null || echo "not found"
   ```

2. 若未安裝，手動安裝：
   ```bash
   npm install --workspace=packages/core @swc/core --save-dev
   ```

3. tsup 需要 `@swc/core` 在同一 workspace 的 `node_modules` 中。若使用 npm hoisting，可能需要在 root devDeps 也加入 `@swc/core`。
