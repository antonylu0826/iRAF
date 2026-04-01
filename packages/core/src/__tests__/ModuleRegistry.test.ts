import "reflect-metadata"
import { describe, it, expect, beforeEach } from "vitest"
import { ModuleRegistry, defineModule, SYSTEM_ROLES } from "../registry/ModuleRegistry"
import { EntityRegistry } from "../registry/EntityRegistry"
import { iEntity } from "../decorators/iEntity"
import { iField } from "../decorators/iField"
import { BaseObject } from "../base/BaseObject"

// ─── 測試用假實體 ──────────────────────────────────────────────────────────────

@iEntity("test-customers", { caption: "客戶", icon: "Users" })
class TestCustomer extends BaseObject {
  @iField.string({ caption: "姓名" })
  name = ""
}

@iEntity("test-orders", { caption: "訂單" })
class TestOrder extends BaseObject {
  @iField.string({ caption: "品項" })
  item = ""
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("defineModule", () => {
  it("回傳 frozen IModuleDef 物件", () => {
    const mod = defineModule({ key: "sales", caption: "銷售", entities: [TestCustomer] })
    expect(mod.key).toBe("sales")
    expect(mod.caption).toBe("銷售")
    expect(Object.isFrozen(mod)).toBe(true)
  })
})

describe("ModuleRegistry", () => {
  beforeEach(() => {
    ModuleRegistry.clear()
  })

  // ─── use / getAll / get ──────────────────────────────────────────────────────

  it("use() 登記模組後 getAll() 回傳", () => {
    const mod = defineModule({ key: "sales", caption: "銷售", entities: [TestCustomer] })
    ModuleRegistry.use(mod)
    expect(ModuleRegistry.getAll()).toHaveLength(1)
    expect(ModuleRegistry.getAll()[0].key).toBe("sales")
  })

  it("get() 可取得指定 key 的模組", () => {
    const mod = defineModule({ key: "sales", caption: "銷售" })
    ModuleRegistry.use(mod)
    expect(ModuleRegistry.get("sales")?.caption).toBe("銷售")
    expect(ModuleRegistry.get("nonexistent")).toBeUndefined()
  })

  it("use() 自動呼叫 EntityRegistry.register()", () => {
    ModuleRegistry.use(defineModule({ key: "sales", caption: "銷售", entities: [TestCustomer] }))
    expect(EntityRegistry.getAll()).toContain(TestCustomer)
  })

  // ─── 重複 key ────────────────────────────────────────────────────────────────

  it("use() 重複 key 拋錯", () => {
    ModuleRegistry.use(defineModule({ key: "sales", caption: "銷售" }))
    expect(() =>
      ModuleRegistry.use(defineModule({ key: "sales", caption: "銷售 2" }))
    ).toThrow(/模組 "sales" 已存在/)
  })

  // ─── requires ────────────────────────────────────────────────────────────────

  it("requires 依賴滿足時正常登記", () => {
    const core = defineModule({ key: "core", caption: "核心" })
    const sales = defineModule({ key: "sales", caption: "銷售", requires: ["core"] })
    expect(() => ModuleRegistry.use(core, sales)).not.toThrow()
    expect(ModuleRegistry.getAll()).toHaveLength(2)
  })

  it("requires 依賴缺失時拋錯", () => {
    const sales = defineModule({ key: "sales", caption: "銷售", requires: ["core"] })
    expect(() => ModuleRegistry.use(sales)).toThrow(/模組 "sales" 依賴 "core"/)
  })

  it("requires 在同一批 use() 中依序滿足", () => {
    const core = defineModule({ key: "core", caption: "核心" })
    const sales = defineModule({ key: "sales", caption: "銷售", requires: ["core"] })
    // core 先於 sales 傳入，應正常
    expect(() => ModuleRegistry.use(core, sales)).not.toThrow()
  })

  // ─── getMenu ─────────────────────────────────────────────────────────────────

  it("getMenu() 未指定 menu 時自動從 entities 生成", () => {
    ModuleRegistry.use(defineModule({
      key: "sales",
      caption: "銷售",
      entities: [TestCustomer, TestOrder],
    }))
    const menu = ModuleRegistry.getMenu("sales")
    expect(menu).toHaveLength(2)
    expect(menu[0].entity).toBe(TestCustomer)
    expect(menu[1].entity).toBe(TestOrder)
  })

  it("getMenu() 指定 menu 時依 order 排序", () => {
    ModuleRegistry.use(defineModule({
      key: "sales",
      caption: "銷售",
      entities: [TestCustomer, TestOrder],
      menu: [
        { type: "entity", entity: TestOrder, order: 1 },
        { type: "entity", entity: TestCustomer, order: 2 },
      ],
    }))
    const menu = ModuleRegistry.getMenu("sales")
    expect(menu[0].entity).toBe(TestOrder)
    expect(menu[1].entity).toBe(TestCustomer)
  })

  it("getMenu() 找不到模組時回傳空陣列", () => {
    expect(ModuleRegistry.getMenu("nonexistent")).toEqual([])
  })

  // ─── findModuleByEntity ───────────────────────────────────────────────────────

  it("findModuleByEntity() 找到所屬模組", () => {
    ModuleRegistry.use(defineModule({ key: "sales", caption: "銷售", entities: [TestCustomer] }))
    const mod = ModuleRegistry.findModuleByEntity(TestCustomer)
    expect(mod?.key).toBe("sales")
  })

  it("findModuleByEntity() 找不到時回傳 undefined", () => {
    expect(ModuleRegistry.findModuleByEntity(TestOrder)).toBeUndefined()
  })

  // ─── clear ───────────────────────────────────────────────────────────────────

  it("clear() 後所有模組消失", () => {
    ModuleRegistry.use(defineModule({ key: "sales", caption: "銷售" }))
    ModuleRegistry.clear()
    expect(ModuleRegistry.getAll()).toHaveLength(0)
  })

  // ─── getAllRoles (P6) ────────────────────────────────────────────────────────

  it("getAllRoles() 無模組時回傳系統預設角色", () => {
    const roles = ModuleRegistry.getAllRoles()
    expect(roles).toContain("admins")
    expect(roles).toContain("users")
  })

  it("getAllRoles() 聚合模組宣告角色並去重", () => {
    ModuleRegistry.use(defineModule({ key: "sales", caption: "銷售", roles: ["sale_managers", "sale_member"] }))
    ModuleRegistry.use(defineModule({ key: "hr",    caption: "人資",  roles: ["hr_admin", "admins"] })) // admins 重複
    const roles = ModuleRegistry.getAllRoles()
    expect(roles).toContain("admins")
    expect(roles).toContain("users")
    expect(roles).toContain("sale_managers")
    expect(roles).toContain("sale_member")
    expect(roles).toContain("hr_admin")
    // 去重：admins 只出現一次
    expect(roles.filter((r) => r === "admins")).toHaveLength(1)
  })

  it("SYSTEM_ROLES 包含 admins 和 users", () => {
    expect(SYSTEM_ROLES).toContain("admins")
    expect(SYSTEM_ROLES).toContain("users")
  })
})
