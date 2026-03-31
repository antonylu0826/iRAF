import "reflect-metadata"
import { describe, it, expect } from "vitest"
import { IRAF_ENTITY_KEY, type IEntityMeta } from "../types/metadata"
import { iEntity } from "../decorators/iEntity"

describe("iEntity", () => {
  it("stores caption in iRAF entity metadata", () => {
    @iEntity("test_customers", {
      caption: "客戶",
      icon: "Users",
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
      allowApiCrud: true,
    })
    class TestProduct {
      id = ""
    }
    const meta: IEntityMeta = Reflect.getMetadata(IRAF_ENTITY_KEY, TestProduct)
    expect(meta.icon).toBe("Package")
    expect((meta as any).module).toBeUndefined()
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
