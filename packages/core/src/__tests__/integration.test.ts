import "reflect-metadata"
import { describe, it, expect, beforeEach } from "vitest"
import { remult, InMemoryDataProvider } from "remult"
import { iEntity } from "../decorators/iEntity"
import { iField } from "../decorators/iField"
import { BaseObject } from "../base/BaseObject"

// ─── 測試用 BO ─────────────────────────────────────────────────────────────────
@iEntity("integ_customers", {
  caption: "整合測試客戶",
  allowApiCrud: true,
})
class IntegCustomer extends BaseObject {
  @iField.string({ caption: "姓名", required: true })
  name = ""

  @iField.string({ caption: "電話", group: "聯絡資訊" })
  phone = ""
}

// ─── 測試 ─────────────────────────────────────────────────────────────────────
describe("BaseObject + @iEntity integration", () => {
  beforeEach(() => {
    remult.dataProvider = new InMemoryDataProvider()
  })

  it("auto-generates a non-empty id on insert", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "王小明" })
    expect(customer.id).toBeTruthy()
    expect(customer.id.length).toBeGreaterThan(0)
  })

  it("auto-fills createdAt on insert", async () => {
    const before = new Date()
    const customer = await remult.repo(IntegCustomer).insert({ name: "王小明" })
    const after = new Date()
    expect(customer.createdAt).toBeInstanceOf(Date)
    expect(customer.createdAt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(customer.createdAt!.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it("auto-fills updatedAt on insert", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "王小明" })
    expect(customer.updatedAt).toBeInstanceOf(Date)
  })

  it("auto-fills updatedAt on update", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "王小明" })
    const original = customer.updatedAt!.getTime()

    // 等待 1ms 確保時間差異
    await new Promise((r) => setTimeout(r, 1))

    const updated = await remult.repo(IntegCustomer).save({
      ...customer,
      phone: "0912345678",
    })
    expect(updated.updatedAt!.getTime()).toBeGreaterThanOrEqual(original)
  })

  it("createdAt does not change on update", async () => {
    const customer = await remult.repo(IntegCustomer).insert({ name: "王小明" })
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
    const customer = await remult.repo(IntegCustomer).insert({ name: "李四" })
    const found = await remult.repo(IntegCustomer).findId(customer.id)
    expect(found?.name).toBe("李四")
  })
})
