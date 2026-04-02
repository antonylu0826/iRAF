// modules/sample/src/entities/DetailSecond.ts
import { iEntity, iField, BaseObject } from "@iraf/core"

/**
 * DetailSecond — second detail collection for MasterItem.
 */
@iEntity("detail-seconds", {
  caption: "Detail Second",
  icon: "ListChecks",
  allowedRoles: {
    read: ["admins", "managers", "users"],
    create: ["admins", "managers", "users"],
    update: ["admins", "managers", "users"],
    delete: ["admins", "managers", "users"],
  },
})
export class DetailSecond extends BaseObject {
  @iField.string({ caption: "Item Code", required: true, order: 1 })
  code = ""

  @iField.string({ caption: "Item Name", required: true, order: 2 })
  title = ""

  @iField.number({ caption: "Amount", order: 3 })
  amount = 0

  @iField.boolean({ caption: "Active", order: 4 })
  active = true

  @iField.string({ caption: "Description", control: "textarea", order: 5 })
  description = ""

  @iField.string({ caption: "Master ID", hidden: true })
  masterId = ""
}
