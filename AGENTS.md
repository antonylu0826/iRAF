# iRAF — AI Agent 開發指引

本文件是 AI Agent 開發 iRAF 時的核心參考。每次對話開始時應先讀取此檔案。

## 專案結構

- `packages/core/` — `@iraf/core`：框架核心（decorator、EntityRegistry、BaseObject）
- `packages/react/` — `@iraf/react`：React UI 層（App Shell、ListView、DetailView）
- `app/` — 應用程式目錄
- `PLAN.md` — 整體架構規劃
- `docs/superpowers/plans/` — 各 Phase 的詳細實作計畫

## 命名慣例

| 類型 | 命名規則 | 範例 |
|------|---------|------|
| BO 類別 | PascalCase | `Customer`, `Order` |
| BO 檔案 | PascalCase.ts | `Customer.ts` |
| Decorator | camelCase (i 前綴) | `@iEntity`, `@iField` |
| React 元件 | PascalCase | `ListView`, `DetailView` |
| 工具函式 | camelCase | `getEntityMetadata()` |

## BO 定義範本

每個 Business Object 應遵循此結構：

```ts
// packages/core/src/entities/Customer.ts
import { iEntity, iField } from "@iraf/core"
import { BaseObject } from "@iraf/core"

@iEntity("customers", {
  caption: "客戶",
  icon: "Users",
  module: "銷售",
})
export class Customer extends BaseObject {
  @iField.string({ caption: "姓名", required: true })
  name = ""

  @iField.string({ caption: "電話", group: "聯絡資訊" })
  phone = ""
}
```

## 技術限制

- TypeScript `experimentalDecorators: true` + `useDefineForClassFields: false` 是 Remult 的必要設定，不可更改
- 所有 BO 必須繼承 `BaseObject`
- 所有跨表操作必須在 `remult.dataProvider.transaction()` 內執行

## 當前 Phase

查看 `PLAN.md` 的「開發階段規劃」確認目前進度。
每個 Phase 的詳細步驟在 `docs/superpowers/plans/` 目錄下。
