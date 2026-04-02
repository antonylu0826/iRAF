import "reflect-metadata"
import { describe, it, expect } from "vitest"
import { IRAF_FIELD_KEY, type IFieldMeta } from "../types/metadata"
import { iField } from "../decorators/iField"

describe("iField.string", () => {
  it("stores group in iRAF field metadata", () => {
    class TestEntity {
      @iField.string({ caption: "Name", group: "General Info" })
      name = ""
    }
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, TestEntity) ?? {}
    expect(meta["name"]).toMatchObject({ caption: "Name", group: "General Info" })
    expect(meta["name"]._type).toBe("string")
  })

  it("stores readOnly and hidden flags", () => {
    class TestEntity {
      @iField.string({ readOnly: true, hidden: true })
      createdBy = ""
    }
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, TestEntity) ?? {}
    expect(meta["createdBy"]).toMatchObject({ readOnly: true, hidden: true })
  })

  it("stores caption in iRAF field metadata", () => {
    class TestEntity {
      @iField.string({ caption: "Description" })
      description = ""
    }
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, TestEntity) ?? {}
    expect(meta["description"]).toMatchObject({ caption: "Description" })
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
      @iField.number({ caption: "Amount", order: 2 })
      amount = 0
    }
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, TestEntity) ?? {}
    expect(meta["amount"]).toMatchObject({ caption: "Amount", order: 2 })
    expect(meta["amount"]._type).toBe("number")
  })
})

describe("iField.date", () => {
  it("stores hidden flag", () => {
    class TestEntity {
      @iField.date({ hidden: true })
      createdAt?: Date
    }
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, TestEntity) ?? {}
    expect(meta["createdAt"]).toMatchObject({ hidden: true })
    expect(meta["createdAt"]._type).toBe("date")
  })
})

describe("iField.boolean", () => {
  it("stores readOnly flag", () => {
    class TestEntity {
      @iField.boolean({ readOnly: true })
      isActive = true
    }
    const meta: Record<string, IFieldMeta> = Reflect.getMetadata(IRAF_FIELD_KEY, TestEntity) ?? {}
    expect(meta["isActive"]).toMatchObject({ readOnly: true })
    expect(meta["isActive"]._type).toBe("boolean")
  })
})
