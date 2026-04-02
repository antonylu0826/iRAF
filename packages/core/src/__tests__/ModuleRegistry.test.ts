import "reflect-metadata"
import { describe, it, expect, beforeEach } from "vitest"
import { ModuleRegistry, defineModule, SYSTEM_ROLES } from "../registry/ModuleRegistry"
import { EntityRegistry } from "../registry/EntityRegistry"
import { iEntity } from "../decorators/iEntity"
import { iField } from "../decorators/iField"
import { BaseObject } from "../base/BaseObject"

// ─── Fake entities for tests ─────────────────────────────────────────────────

@iEntity("test-customers", { caption: "Customer", icon: "Users" })
class TestCustomer extends BaseObject {
  @iField.string({ caption: "Name" })
  name = ""
}

@iEntity("test-orders", { caption: "Order" })
class TestOrder extends BaseObject {
  @iField.string({ caption: "Item" })
  item = ""
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("defineModule", () => {
  it("returns a frozen IModuleDef object", () => {
    const mod = defineModule({ key: "sales", caption: "Sales", entities: [TestCustomer] })
    expect(mod.key).toBe("sales")
    expect(mod.caption).toBe("Sales")
    expect(Object.isFrozen(mod)).toBe(true)
  })
})

describe("ModuleRegistry", () => {
  beforeEach(() => {
    ModuleRegistry.clear()
  })

  // ─── use / getAll / get ──────────────────────────────────────────────────────

  it("use() registers module then getAll() returns it", () => {
    const mod = defineModule({ key: "sales", caption: "Sales", entities: [TestCustomer] })
    ModuleRegistry.use(mod)
    expect(ModuleRegistry.getAll()).toHaveLength(1)
    expect(ModuleRegistry.getAll()[0].key).toBe("sales")
  })

  it("get() returns module by key", () => {
    const mod = defineModule({ key: "sales", caption: "Sales" })
    ModuleRegistry.use(mod)
    expect(ModuleRegistry.get("sales")?.caption).toBe("Sales")
    expect(ModuleRegistry.get("nonexistent")).toBeUndefined()
  })

  it("use() automatically calls EntityRegistry.register()", () => {
    ModuleRegistry.use(defineModule({ key: "sales", caption: "Sales", entities: [TestCustomer] }))
    expect(EntityRegistry.getAll()).toContain(TestCustomer)
  })

  // ─── Duplicate key ──────────────────────────────────────────────────────────

  it("use() throws on duplicate key", () => {
    ModuleRegistry.use(defineModule({ key: "sales", caption: "Sales" }))
    expect(() =>
      ModuleRegistry.use(defineModule({ key: "sales", caption: "Sales 2" }))
    ).toThrow(/Module "sales" already exists/)
  })

  // ─── requires ────────────────────────────────────────────────────────────────

  it("registers when requires dependencies are satisfied", () => {
    const core = defineModule({ key: "core", caption: "Core" })
    const sales = defineModule({ key: "sales", caption: "Sales", requires: ["core"] })
    expect(() => ModuleRegistry.use(core, sales)).not.toThrow()
    expect(ModuleRegistry.getAll()).toHaveLength(2)
  })

  it("throws when requires dependencies are missing", () => {
    const sales = defineModule({ key: "sales", caption: "Sales", requires: ["core"] })
    expect(() => ModuleRegistry.use(sales)).toThrow(/requires "core"/)
  })

  it("requires can be satisfied within the same use() batch", () => {
    const core = defineModule({ key: "core", caption: "Core" })
    const sales = defineModule({ key: "sales", caption: "Sales", requires: ["core"] })
    // core comes before sales
    expect(() => ModuleRegistry.use(core, sales)).not.toThrow()
  })

  // ─── getMenu ─────────────────────────────────────────────────────────────────

  it("getMenu() auto-generates from entities when menu is not provided", () => {
    ModuleRegistry.use(defineModule({
      key: "sales",
      caption: "Sales",
      entities: [TestCustomer, TestOrder],
    }))
    const menu = ModuleRegistry.getMenu("sales")
    expect(menu).toHaveLength(2)
    expect(menu[0].entity).toBe(TestCustomer)
    expect(menu[1].entity).toBe(TestOrder)
  })

  it("getMenu() sorts by order when menu is provided", () => {
    ModuleRegistry.use(defineModule({
      key: "sales",
      caption: "Sales",
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

  it("getMenu() returns empty array when module not found", () => {
    expect(ModuleRegistry.getMenu("nonexistent")).toEqual([])
  })

  // ─── findModuleByEntity ───────────────────────────────────────────────────────

  it("findModuleByEntity() finds owning module", () => {
    ModuleRegistry.use(defineModule({ key: "sales", caption: "Sales", entities: [TestCustomer] }))
    const mod = ModuleRegistry.findModuleByEntity(TestCustomer)
    expect(mod?.key).toBe("sales")
  })

  it("findModuleByEntity() returns undefined when not found", () => {
    expect(ModuleRegistry.findModuleByEntity(TestOrder)).toBeUndefined()
  })

  // ─── clear ───────────────────────────────────────────────────────────────────

  it("clear() removes all modules", () => {
    ModuleRegistry.use(defineModule({ key: "sales", caption: "Sales" }))
    ModuleRegistry.clear()
    expect(ModuleRegistry.getAll()).toHaveLength(0)
  })

  // ─── getAllRoles (P6) ────────────────────────────────────────────────────────

  it("getAllRoles() returns system defaults when no modules", () => {
    const roles = ModuleRegistry.getAllRoles()
    expect(roles).toContain("admins")
    expect(roles).toContain("users")
  })

  it("getAllRoles() aggregates module roles and de-dupes", () => {
    ModuleRegistry.use(defineModule({ key: "sales", caption: "Sales", roles: ["sale_managers", "sale_member"] }))
    ModuleRegistry.use(defineModule({ key: "hr",    caption: "HR",  roles: ["hr_admin", "admins"] })) // duplicate admins
    const roles = ModuleRegistry.getAllRoles()
    expect(roles).toContain("admins")
    expect(roles).toContain("users")
    expect(roles).toContain("sale_managers")
    expect(roles).toContain("sale_member")
    expect(roles).toContain("hr_admin")
    // de-dupe: admins appears once
    expect(roles.filter((r) => r === "admins")).toHaveLength(1)
  })

  it("SYSTEM_ROLES includes admins and users", () => {
    expect(SYSTEM_ROLES).toContain("admins")
    expect(SYSTEM_ROLES).toContain("users")
  })

  // ─── Lifecycle (P8) ─────────────────────────────────────────────────────────

  it("initAll() runs onInit in order", async () => {
    const order: number[] = []
    ModuleRegistry.use(defineModule({ key: "a", caption: "A", onInit: () => { order.push(1) } }))
    ModuleRegistry.use(defineModule({ key: "b", caption: "B", onInit: async () => { order.push(2) } }))
    await ModuleRegistry.initAll()
    expect(order).toEqual([1, 2])
  })

  it("serverInitAll() runs onServerInit in order", async () => {
    const order: number[] = []
    ModuleRegistry.use(defineModule({ key: "a", caption: "A", onServerInit: async () => { order.push(1) } }))
    ModuleRegistry.use(defineModule({ key: "b", caption: "B", onServerInit: () => { order.push(2) } }))
    await ModuleRegistry.serverInitAll()
    expect(order).toEqual([1, 2])
  })

  it("destroyAll() runs onDestroy", () => {
    const destroyed: string[] = []
    ModuleRegistry.use(defineModule({ key: "a", caption: "A", onDestroy: () => { destroyed.push("a") } }))
    ModuleRegistry.use(defineModule({ key: "b", caption: "B", onDestroy: () => { destroyed.push("b") } }))
    ModuleRegistry.destroyAll()
    expect(destroyed).toEqual(["a", "b"])
  })

  it("clear() calls destroyAll() then clears modules", () => {
    const destroyed: string[] = []
    ModuleRegistry.use(defineModule({ key: "a", caption: "A", onDestroy: () => { destroyed.push("a") } }))
    ModuleRegistry.clear()
    expect(destroyed).toEqual(["a"])
    expect(ModuleRegistry.getAll()).toHaveLength(0)
  })

  it("modules without lifecycle hooks do not throw", async () => {
    ModuleRegistry.use(defineModule({ key: "plain", caption: "Plain" }))
    await expect(ModuleRegistry.initAll()).resolves.toBeUndefined()
    await expect(ModuleRegistry.serverInitAll()).resolves.toBeUndefined()
    expect(() => ModuleRegistry.destroyAll()).not.toThrow()
  })
})
