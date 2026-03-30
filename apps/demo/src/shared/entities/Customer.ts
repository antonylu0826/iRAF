// apps/demo/src/shared/entities/Customer.ts
import { iEntity, iField, BaseObject } from "@iraf/core"

/**
 * Customer — iRAF Demo 的第一個 Business Object。
 * 示範 @iEntity / @iField 的標準使用方式。
 */
@iEntity("customers", {
  caption: "客戶",
  icon: "Users",
  module: "銷售",
  allowApiCrud: true,
})
export class Customer extends BaseObject {
  @iField.string({ caption: "姓名", required: true })
  name = ""

  @iField.string({ caption: "電話", group: "聯絡資訊" })
  phone = ""

  @iField.string({ caption: "Email", group: "聯絡資訊" })
  email = ""
}
