import { iEntity, iField, BaseObject } from "@iraf/core"

/**
 * Customer — iRAF Demo 的第一個 Business Object。
 * 示範 @iEntity / @iField 的標準使用方式，包含跨欄位驗證。
 */
@iEntity("customers", {
  caption: "客戶",
  icon: "Users",
  module: "銷售",
  allowApiCrud: true,
})
export class Customer extends BaseObject {
  @iField.string({ caption: "姓名", required: true, order: 1 })
  name = ""

  @iField.string({ caption: "電話", group: "聯絡資訊", order: 2 })
  phone = ""

  @iField.string({
    caption: "Email",
    group: "聯絡資訊",
    order: 3,
    validate: (_value, entity: Customer) => {
      if (entity.email && entity.phone && entity.email === entity.phone) {
        return "Email 與電話不能相同"
      }
    },
  })
  email = ""
}
