import { iEntity, iField, BaseObject } from "@iraf/core"
import { SampleController } from "../controllers/SampleController"

/**
 * Sample — 用於測試 iRAF 框架各種功能的測試物件。
 */
@iEntity("samples", {
  caption: "範例測試",
  icon: "FlaskConical",
  allowApiCrud: true,
})
export class Sample extends BaseObject {
  // --- 基本欄位測試 ---
  @iField.string({
    caption: "標題",
    required: true,
    group: "基本資訊",
    order: 1
  })
  title = ""

  @iField.string({
    caption: "描述",
    control: "textarea",
    group: "基本資訊",
    order: 2
  })
  description = ""

  // --- 數字與日期測試 ---
  @iField.number({
    caption: "數值",
    group: "數值與日期",
    order: 10,
    validate: (val) => {
      if (val < 0) return "數值不能小於 0"
    }
  })
  count = 0

  @iField.date({
    caption: "測試日期",
    group: "數值與日期",
    order: 11
  })
  testDate = new Date()

  // --- 控制項與特殊測試 ---
  @iField.boolean({
    caption: "是否啟用",
    group: "狀態控制",
    order: 20
  })
  isActive = true

  @iField.string({
    caption: "密碼測試",
    control: "password",
    group: "狀態控制",
    order: 21,
    hidden: (e: Sample) => !e.isActive
  })
  password = ""

  // --- 跨欄位連動測試 ---
  @iField.string({
    caption: "唯讀測試",
    group: "進階測試",
    order: 30,
    readOnly: (e: Sample) => e.title?.includes("READONLY") ?? false,
    placeholder: "標題包含 'READONLY' 時，此欄位將變為唯讀"
  })
  readOnlyText = ""

  // --- Actions ---
  static incrementCount = SampleController.incrementCount
  static toggleActive = SampleController.toggleActive
}
