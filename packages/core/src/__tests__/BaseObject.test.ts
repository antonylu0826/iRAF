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
