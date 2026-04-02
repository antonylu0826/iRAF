// modules/sample/src/entities/MasterItem.ts
import { iEntity, iField, BaseObject } from "@iraf/core"
import { DetailItem } from "./DetailItem"

/**
 * MasterItem — Master-Detail 示範的主項目。
 *
 * 包含 details 子集合，由 @iField.collection 宣告，
 * DetailView 會自動渲染為 SubGrid control。
 * 使用者可以在主記錄尚未儲存時就輸入明細，儲存後自動批量寫入。
 */
@iEntity("master-items", {
  caption: "主項目",
  icon: "ListOrdered",
  allowedRoles: {
    read:   ["admins", "managers", "users"],
    create: ["admins", "managers", "users"],
    update: ["admins", "managers", "users"],
    delete: ["admins", "managers"],
  },
})
export class MasterItem extends BaseObject {
  @iField.string({ caption: "名稱", required: true, order: 1 })
  name = ""

  @iField.string({ caption: "說明", control: "textarea", order: 2 })
  description = ""

  @iField.collection({
    caption: "明細項目",
    entity: () => DetailItem,
    foreignKey: "masterId",
    order: 10,
  })
  details: DetailItem[] = []
}
