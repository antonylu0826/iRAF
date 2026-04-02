// modules/sample/src/entities/DetailFirst.ts
import { iEntity, iField, BaseObject } from "@iraf/core"

/**
 * DetailFirst — MasterItem 的第一組明細。
 */
@iEntity("detail-firsts", {
  caption: "明細一",
  icon: "ListTree",
  allowedRoles: {
    read: ["admins", "managers", "users"],
    create: ["admins", "managers", "users"],
    update: ["admins", "managers", "users"],
    delete: ["admins", "managers", "users"],
  },
})
export class DetailFirst extends BaseObject {
  @iField.string({ caption: "品項名稱", required: true, order: 1 })
  name = ""

  @iField.number({ caption: "數量", order: 2 })
  quantity = 1

  @iField.number({ caption: "單價", order: 3 })
  unitPrice = 0

  @iField.string({
    caption: "分類",
    options: ["原料", "半成品", "成品", "耗材"],
    order: 4,
  })
  category = ""

  @iField.date({ caption: "到期日", order: 5 })
  dueDate?: Date

  @iField.boolean({ caption: "已確認", order: 6 })
  confirmed = false

  @iField.string({ caption: "備註", control: "textarea", order: 7 })
  note = ""

  @iField.string({ caption: "主項目 ID", hidden: true })
  masterId = ""
}
