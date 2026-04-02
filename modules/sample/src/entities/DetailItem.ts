// modules/sample/src/entities/DetailItem.ts
import { iEntity, iField, BaseObject } from "@iraf/core"

/**
 * DetailItem — detail rows for MasterItem.
 * Covers multiple field types as a SubGrid control demo.
 */
@iEntity("detail-items", {
  caption: "Detail Items",
  icon: "ListTree",
  allowedRoles: {
    read:   ["admins", "managers", "users"],
    create: ["admins", "managers", "users"],
    update: ["admins", "managers", "users"],
    delete: ["admins", "managers", "users"],
  },
})
export class DetailItem extends BaseObject {
  @iField.string({ caption: "Item Name", required: true, order: 1 })
  name = ""

  @iField.number({ caption: "Quantity", order: 2 })
  quantity = 1

  @iField.number({ caption: "Unit Price", order: 3 })
  unitPrice = 0

  @iField.string({
    caption: "Category",
    options: ["Raw", "Semi-finished", "Finished", "Supplies"],
    order: 4,
  })
  category = ""

  @iField.date({ caption: "Due Date", order: 5 })
  dueDate?: Date

  @iField.boolean({ caption: "Confirmed", order: 6 })
  confirmed = false

  @iField.string({ caption: "Note", control: "textarea", order: 7 })
  note = ""

  @iField.string({
    caption: "Assignee",
    ref: "users",
    refLabel: "displayName",
    order: 8,
  })
  assigneeId = ""

  @iField.string({ caption: "Master ID", hidden: true })
  masterId = ""
}
