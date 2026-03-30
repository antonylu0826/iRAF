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

  it("stores no iRAF metadata when no UI options given", () => {
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
