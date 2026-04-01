# Phase 6 — 安全強化與 RBAC 配置 Design Spec

**Date:** 2026-04-01  
**Status:** Approved

---

## Overview

Phase 6 為 iRAF 框架加入完整的 RBAC（Role-Based Access Control）配置層，包含角色宣告、模組可視性控制、欄位寫入權限、Row-level 存取控制、使用者管理強化，以及密碼強度規則引擎。

不在範圍內：Email 驗證、忘記密碼流程（以「聯絡管理員重設密碼」取代）。

---

## 1. 角色系統（Role System）

### 設計

角色由各模組在 `defineModule()` 時宣告，`ModuleRegistry` 負責聚合所有角色。框架提供兩個系統預設角色。

```ts
// 系統預設角色（框架內建，無需宣告）
// "admins", "users"

// 模組宣告自有角色
export const SalesModule = defineModule({
  key: "sales",
  caption: "業務",
  roles: ["sale_managers", "sale_member"],   // 新增
  allowedRoles: ["admins", "sale_managers"], // 控制模組可視性
  entities: [Customer],
})

// 聚合
ModuleRegistry.getAllRoles()
// → ["admins", "users", "sale_managers", "sale_member", ...]
```

### 實作位置

- `packages/core` — `IModuleOptions.roles?: string[]`，`ModuleRegistry.getAllRoles()`，`SYSTEM_ROLES` 常數
- `packages/react/Sidebar.tsx` — 比對 `user.roles` vs `module.allowedRoles`，無交集則隱藏模組

---

## 2. Field 寫入權限（writeRoles）

### 設計

`@iField` 新增 `writeRoles` 選項。非指定角色的使用者對該欄位自動 readOnly。後端儲存時也會拒絕未授權的欄位修改。

```ts
@iField.string({
  caption: "薪資",
  writeRoles: ["admins"],  // 只有 admins 可寫
})
salary = 0
```

`writeRoles` 與 `readOnly` 的關係：兩者取 OR，任一為 true 則欄位為唯讀。

### 實作位置

- `packages/core` — `IFieldMeta.writeRoles?: string[]`
- `plugins/system/DetailView.tsx` — 判斷 `writeRoles` vs `user.roles`，決定 control 的 `disabled` 狀態

---

## 3. Row-Level 存取控制

### 設計

`allowedRoles` 的每個操作除了接受 `string[]`，也可接受 predicate function，支援 row-level 判斷。

```ts
// 型別擴充
type RoleCheck = string[] | ((user: AuthUser | undefined, row?: any) => boolean)

// 使用範例：使用者只能修改自己的 profile
@iEntity("users", {
  allowedRoles: {
    read:   ["admins", "users"],
    update: (user, row) => user?.roles?.includes("admins") || user?.id === row?.id,
    delete: ["admins"],
    create: ["admins"],
  },
})
```

- **後端**：function 對應 Remult 的 `allowApiUpdate: (remult, self) => ...`
- **前端**：DetailView / ListView 用 `(user, row)` 呼叫，逐列決定編輯/刪除按鈕可見性

### 實作位置

- `packages/core` — `IAllowedRoles` 型別擴充，`@iEntity` decorator 更新
- `plugins/system/DetailView.tsx` — 呼叫 predicate 決定 `canSave`
- `plugins/system/ListView.tsx` — 逐列呼叫 predicate 決定 `canDelete` / `canEdit`

---

## 4. 使用者管理強化（modules/system）

### AppUser 擴充

```ts
@iEntity("users", {
  allowedRoles: {
    read:   ["admins", "users"],
    update: (user, row) => user?.roles?.includes("admins") || user?.id === row?.id,
    delete: ["admins"],
    create: ["admins"],
  },
})
export class AppUser extends BaseObject {
  @iField.string({ caption: "帳號", required: true, order: 1 })
  username = ""

  @iField.string({ caption: "密碼雜湊", hidden: true, readOnly: true })
  passwordHash = ""

  @iField.string({ caption: "顯示名稱", order: 2 })
  displayName = ""

  @iField.boolean({ caption: "啟用", order: 3 })
  isActive = true

  @iField.json({
    caption: "角色",
    control: "roles",  // multi-select control
    order: 4,
    writeRoles: ["admins"],
  })
  roles: string[] = []
}
```

### UserController（新增）

```ts
export class UserController {
  @iAction({ caption: "重設密碼", icon: "KeyRound", allowedRoles: ["admins"] })
  static async resetPassword(id: string, newPassword: string): Promise<void>

  @iAction({ caption: "切換啟用狀態", icon: "Power", allowedRoles: ["admins"] })
  static async toggleActive(id: string): Promise<void>
}
```

### Multi-select Roles Control（plugins/system）

新增 `"roles"` control plugin：
- 讀取 `ModuleRegistry.getAllRoles()` 取得可選角色清單
- 渲染為 checkbox group 或 tag selector
- 遵循 `IControlProps` 介面

---

## 5. 密碼強度規則引擎

### 設計

`packages/core` 提供 `passwordRules()` helper，回傳標準 validate function。

```ts
import { passwordRules } from "@iraf/core"

@iField.string({
  caption: "新密碼",
  control: "password",
  validate: passwordRules({ minLength: 8, requireUppercase: true, requireSpecial: true }),
})
newPassword = ""
```

`passwordRules(options)` 支援選項：
- `minLength: number`（預設 8）
- `requireUppercase: boolean`
- `requireLowercase: boolean`
- `requireNumber: boolean`
- `requireSpecial: boolean`

---

## 架構總覽

| 功能 | 修改/新增位置 |
|---|---|
| `IModuleOptions.roles` + `getAllRoles()` | `packages/core` |
| Sidebar 模組可視性過濾 | `packages/react` |
| `IFieldMeta.writeRoles` | `packages/core` |
| `IAllowedRoles` predicate 支援 | `packages/core` |
| Multi-select Roles control | `plugins/system` |
| `AppUser.isActive` + roles 可見 | `modules/system` |
| `UserController` | `modules/system` |
| `passwordRules()` | `packages/core` |

---

## 測試計畫

- `ModuleRegistry.getAllRoles()` — 聚合系統預設 + 模組角色
- `ModuleRegistry.use()` — `allowedRoles` 設定後 Sidebar 過濾正確
- `writeRoles` — 非授權 user 的 DetailView control 為 disabled
- `allowedRoles` predicate — 後端拒絕未授權修改；前端逐列判斷正確
- `passwordRules()` — 各規則組合的 validate 回傳正確訊息
- `UserController.resetPassword` / `toggleActive` — 功能正確
