import "reflect-metadata"
import { describe, it, expect, beforeEach } from "vitest"
import { remult, InMemoryDataProvider } from "remult"
import { iEntity } from "../decorators/iEntity"
import { iField } from "../decorators/iField"
import { BaseObject } from "../base/BaseObject"

// ─── Test BO ─────────────────────────────────────────────────────────────────
@iEntity("integ_customers", {
  caption: "Integration Test Customer",
  allowApiCrud: true,
})
class IntegCustomer extends BaseObject {
  @iField.string({ caption: "Name", required: true })
  name = ""

  @iField.string({ caption: "Phone", group: "Contact Info" })
  phone = ""
}

// ─── Tests ───────────────────────────────────────────────────────────────────
describe("BaseObject + @iEntity integration", () => {
  beforeEach(() => {
    remult.dataProvider = new InMemoryDataProvider()
  })

  it("auto-generates a non-empty id on insert", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "Test User" })
    expect(customer.id).toBeTruthy()
    expect(customer.id.length).toBeGreaterThan(0)
  })

  it("auto-fills createdAt on insert", async () => {
    const before = new Date()
    const customer = await remult.repo(IntegCustomer).insert({ name: "Test User" })
    const after = new Date()
    expect(customer.createdAt).toBeInstanceOf(Date)
    expect(customer.createdAt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(customer.createdAt!.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it("auto-fills updatedAt on insert", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "Test User" })
    expect(customer.updatedAt).toBeInstanceOf(Date)
  })

  it("auto-fills updatedAt on update", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "Test User" })
    const original = customer.updatedAt!.getTime()

    // Wait 1ms to ensure time difference
    await new Promise((r) => setTimeout(r, 1))

    const updated = await remult.repo(IntegCustomer).save({
      ...customer,
      phone: "0912345678",
    })
    expect(updated.updatedAt!.getTime()).toBeGreaterThanOrEqual(original)
  })

  it("createdAt does not change on update", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "Test User" })
    const originalCreatedAt = customer.createdAt!.getTime()

    await new Promise((r) => setTimeout(r, 1))

    const updated = await remult.repo(IntegCustomer).save({
      ...customer,
      phone: "0912345678",
    })
    expect(updated.createdAt!.getTime()).toBe(originalCreatedAt)
  })

  it("throws validation error when required field is empty", async () => {
    await expect(
      remult.repo(IntegCustomer).insert({ name: "" })
    ).rejects.toThrow()
  })

  it("can find a saved entity by id", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "Sample User" })
    const found = await remult.repo(IntegCustomer).findId(customer.id)
    expect(found?.name).toBe("Sample User")
  })
})
