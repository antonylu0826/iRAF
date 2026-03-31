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
    expect(fieldMeta["name"]).toMatchObject({ caption: "姓名", required: true })
  })

  it("clear() empties the registry", () => {
    const { RegCustomer } = makeTestEntities()
    EntityRegistry.register(RegCustomer)
    EntityRegistry.clear()
    expect(EntityRegistry.getAll()).toHaveLength(0)
  })
})
