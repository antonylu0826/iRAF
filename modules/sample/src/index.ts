// modules/sample/src/index.ts
import { defineModule } from "@iraf/core"
import { FeatureGallery, FeatureGalleryController } from "./entities/FeatureGallery"
import { MasterItem } from "./entities/MasterItem"
import { DetailItem } from "./entities/DetailItem"
import { DetailFirst } from "./entities/DetailFirst"
import { DetailSecond } from "./entities/DetailSecond"

/**
 * SampleModule — full-feature demo module for iRAF.
 *
 * Includes:
 * - FeatureGallery: rich metadata, RBAC, and iAction demos
 * - MasterItem / DetailItem: Master-Detail SubGrid demo
 *
 * Menu shows only FeatureGallery and MasterItem;
 * DetailItem is accessed via MasterItem SubGrid.
 */
export const SampleModule = defineModule({
  key: "sample",
  caption: "Sample",
  icon: "FlaskConical",
  description: "Showcases metadata configuration, RBAC, iAction, and Master-Detail SubGrid.",
  entities: [FeatureGallery, MasterItem, DetailItem, DetailFirst, DetailSecond],
  controllers: [FeatureGalleryController],
  i18n: {
    "zh-TW": {
      "Sample": "範例展示",
      "Feature Gallery": "功能展示",
      "Master Items": "主項目",
      "Detail Items": "明細項目",
      "Detail First": "明細一",
      "Detail Second": "明細二",

      "General Info": "基本資訊",
      "Advanced": "進階測試",
      "Dynamic Rules": "動態規則範例",
      "Security & System": "安全與系統碼",

      "Title (admins only)": "標題 (admins 可寫)",
      "Description (textarea)": "詳細描述 (textarea)",
      "Category": "分類標籤",
      "Counter": "數值計數器",
      "Effective Date": "生效日期",
      "Locked (affects fields below)": "已鎖定 (影響下方欄位)",
      "Read-only when locked": "鎖定時唯讀",
      "Hidden when locked": "鎖定時隱藏的秘密",
      "Password (passwordRules)": "安全密碼 (passwordRules)",
      "Assigned Roles (roles control)": "角色分配集 (roles control)",
      "Priority (Enum/Options)": "優先級 (Enum/Options)",
      "Assignee (Reference/Lookup)": "負責人 (Reference/Lookup)",

      "Name": "名稱",
      "Description": "說明",
      "Item Name": "品項名稱",
      "Quantity": "數量",
      "Unit Price": "單價",
      "Due Date": "到期日",
      "Confirmed": "已確認",
      "Note": "備註",
      "Assignee": "負責人",
      "Master ID": "主項目 ID",

      "Item Code": "項目代碼",
      "Amount": "金額",
      "Active": "啟用",

      "Increment Counter": "增加數值",
      "Toggle Lock": "切換鎖定狀態",
      "Reset Secret": "重設秘密",
    },
  },
  // No menu entries — sample module is for agent reference only (get_example)
  menu: [],
})
