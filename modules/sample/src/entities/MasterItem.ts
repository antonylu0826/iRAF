// modules/sample/src/entities/MasterItem.ts
import { iEntity, iField, BaseObject } from "@iraf/core"
import { DetailItem } from "./DetailItem"
import { DetailFirst } from "./DetailFirst"
import { DetailSecond } from "./DetailSecond"

/**
 * MasterItem — master entity for the Master-Detail demo.
 *
 * Contains detail collections via @iField.collection.
 * DetailView renders them as SubGrid controls automatically.
 * Users can edit details before the master is saved; they are batch-inserted after save.
 */
@iEntity("master-items", {
  caption: "Master Items",
  icon: "ListOrdered",
  allowedRoles: {
    read:   ["admins", "managers", "users"],
    create: ["admins", "managers", "users"],
    update: ["admins", "managers", "users"],
    delete: ["admins", "managers"],
  },
})
export class MasterItem extends BaseObject {
  @iField.string({ caption: "Name", required: true, order: 1 })
  name = ""

  @iField.string({ caption: "Description", control: "textarea", order: 2 })
  description = ""

  @iField.collection({
    caption: "Detail Items",
    entity: () => DetailItem,
    foreignKey: "masterId",
    order: 10,
  })
  details: DetailItem[] = []

  @iField.collection({
    caption: "Detail First",
    entity: () => DetailFirst,
    foreignKey: "masterId",
    order: 11,
  })
  detailFirsts: DetailFirst[] = []

  @iField.collection({
    caption: "Detail Second",
    entity: () => DetailSecond,
    foreignKey: "masterId",
    order: 12,
  })
  detailSeconds: DetailSecond[] = []
}
