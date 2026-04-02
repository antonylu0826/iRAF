import "reflect-metadata"
import { describe, it, expect, beforeEach } from "vitest"
import { iEntity } from "../decorators/iEntity"
import { iField } from "../decorators/iField"
import { BaseObject } from "../base/BaseObject"
import { EntityRegistry } from "../registry/EntityRegistry"

// Test BOs (recreated per test)
function makeTestEntities() {
  @iEntity("reg_customers", { caption: "Customer", icon: "Users", allowApiCrud: true })
  class RegCustomer extends BaseObject {
    @iField.string({ caption: "Name", required: true })
    name = ""
  }

  @iEntity("reg_products", { caption: "Product", icon: "Package", allowApiCrud: true })
  class RegProduct extends BaseObject {
    @iField.string({ caption: "Product Name" })
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
    expect(meta?.caption).toBe("Customer")
    expect(meta?.icon).toBe("Users")
    expect(meta?.key).toBe("reg_customers")
  })

  it("returns iRAF field metadata via getFieldMeta", () => {
    const { RegCustomer } = makeTestEntities()
    EntityRegistry.register(RegCustomer)
    const fieldMeta = EntityRegistry.getFieldMeta(RegCustomer)
    expect(fieldMeta["name"]).toMatchObject({ caption: "Name", required: true })
  })

  it("clear() empties the registry", () => {
    const { RegCustomer } = makeTestEntities()
    EntityRegistry.register(RegCustomer)
    EntityRegistry.clear()
    expect(EntityRegistry.getAll()).toHaveLength(0)
  })
})
