import "reflect-metadata"
import { Fields } from "remult"
import { iField } from "../decorators/iField"

/**
 * BaseObject — 所有 iRAF 業務實體的抽象基底類別。
 *
 * 提供：
 * - `id`：cuid 格式的主鍵，由 Remult 自動生成
 * - `createdAt` / `updatedAt`：由 @iEntity saving hook 自動填寫
 * - `createdBy` / `updatedBy`：由 @iEntity saving hook 自動填寫（remult.user.name）
 *
 * 使用方式：
 * ```ts
 * @iEntity("customers", { caption: "客戶", icon: "Users", module: "銷售" })
 * export class Customer extends BaseObject {
 *   @iField.string({ caption: "姓名", required: true })
 *   name = ""
 * }
 * ```
 */
export abstract class BaseObject {
  @Fields.cuid()
  id = ""

  @iField.date({ caption: "建立時間", readOnly: true, hidden: true, auditField: true })
  createdAt?: Date

  @iField.date({ caption: "更新時間", readOnly: true, hidden: true, auditField: true })
  updatedAt?: Date

  @iField.string({ caption: "建立者", readOnly: true, hidden: true, auditField: true })
  createdBy = ""

  @iField.string({ caption: "更新者", readOnly: true, hidden: true, auditField: true })
  updatedBy = ""
}
