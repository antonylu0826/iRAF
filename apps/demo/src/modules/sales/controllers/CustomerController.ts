import { remult } from "remult"
import { iAction, iController } from "@iraf/core"
import { Customer } from "../entities/Customer"

/**
 * CustomerController — Customer 的業務邏輯層。
 * 示範 @iController / @iAction 的標準使用方式。
 */
@iController(Customer)
export class CustomerController {
  @iAction({
    caption: "寄送歡迎信",
    icon: "Mail",
    allowedRoles: ["admin", "sales"],
  })
  static async sendWelcomeEmail(id: string): Promise<void> {
    const repo = remult.repo(Customer)
    const customer = await repo.findId(id)
    if (!customer) throw new Error("客戶不存在")
    // 實際場景：呼叫 Email service
    console.log(`[Demo] 寄送歡迎信給 ${customer.name} <${customer.email}>`)
  }

  @iAction({
    caption: "標記為 VIP",
    icon: "Star",
    allowedRoles: ["admin"],
  })
  static async markAsVip(id: string): Promise<void> {
    const repo = remult.repo(Customer)
    const customer = await repo.findId(id)
    if (!customer) throw new Error("客戶不存在")
    await repo.save({ ...customer, name: `[VIP] ${customer.name.replace(/^\[VIP\] /, "")}` })
  }
}
