// modules/sample/src/entities/DetailSecond.ts
import { iEntity, iField, BaseObject } from "@iraf/core"

/**
 * DetailSecond — MasterItem 的第二組明細。
 */
@iEntity("detail-seconds", {
  caption: "明細二",
  icon: "ListChecks",
  allowedRoles: {
    read: ["admins", "managers", "users"],
    create: ["admins", "managers", "users"],
    update: ["admins", "managers", "users"],
    delete: ["admins", "managers", "users"],
  },
})
export class DetailSecond extends BaseObject {
  @iField.string({ caption: "項目代碼", required: true, order: 1 })
  code = ""

  @iField.string({ caption: "項目名稱", required: true, order: 2 })
  title = ""

  @iField.number({ caption: "金額", order: 3 })
  amount = 0

  @iField.boolean({ caption: "啟用", order: 4 })
  active = true

  @iField.string({ caption: "說明", control: "textarea", order: 5 })
  description = ""

  @iField.string({ caption: "主項目 ID", hidden: true })
  masterId = ""
}
