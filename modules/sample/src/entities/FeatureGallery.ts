// modules/sample/src/entities/FeatureGallery.ts
import { iEntity, iField, iController, BaseObject, passwordRules, iAction } from "@iraf/core"
import { remult } from "remult"

/**
 * FeatureGallery — iRAF 全功能展示實體。
 */
@iEntity("feature-gallery", {
  caption: "功能展示",
  icon: "Component",
  allowedRoles: {
    read:   ["admins", "managers", "users"],
    create: ["admins", "managers"],
    update: ["admins", "managers"],
    delete: ["admins"],
  },
})
export class FeatureGallery extends BaseObject {
  // --- 基礎分組：基本資訊 ---

  @iField.string({
    caption: "標題 (admins 可寫)",
    required: true,
    group: "基本資訊",
    order: 1,
    writeRoles: ["admins"],
    placeholder: "普通使用者在此欄位為唯讀"
  })
  title = ""

  @iField.string({
    caption: "詳細描述 (textarea)",
    group: "基本資訊",
    order: 2,
    control: "textarea",
  })
  description = ""

  @iField.string({
    caption: "分類標籤",
    group: "基本資訊",
    order: 3,
    placeholder: "自定義分類"
  })
  category = "Default"

  // --- 進階分組：數值與日期 ---

  @iField.number({
    caption: "數值計數器",
    group: "進階測試",
    order: 10,
    validate: (v) => (v < 0 ? "計數不能小於 0" : undefined)
  })
  counter = 0

  @iField.date({
    caption: "生效日期",
    group: "進階測試",
    order: 11,
  })
  effectiveDate = new Date()

  @iField.boolean({
    caption: "已鎖定 (影響下方欄位)",
    group: "進階測試",
    order: 12,
  })
  isLocked = false

  // --- 動態 UI 連動測試 ---

  @iField.string({
    caption: "鎖定時唯讀",
    group: "動態規則範例",
    order: 20,
    readOnly: (e: FeatureGallery) => e.isLocked,
    placeholder: "當「已鎖定」勾選時，此處將變為唯讀"
  })
  lockControlledText = ""

  @iField.string({
    caption: "鎖定時隱藏的秘密",
    group: "動態規則範例",
    order: 21,
    hidden: (e: FeatureGallery) => e.isLocked,
    placeholder: "當「已鎖定」勾選時，此欄位將完全消失"
  })
  secretInfo = ""

  // --- 安全與系統分組 ---

  @iField.string({
    caption: "安全密碼 (passwordRules)",
    group: "安全與系統碼",
    order: 30,
    control: "password",
    validate: passwordRules({ minLength: 8, requireUppercase: true, requireNumber: true }),
  })
  demoPassword = ""

  @iField.json({
    caption: "角色分配集 (roles control)",
    group: "安全與系統碼",
    order: 31,
    control: "roles",
    writeRoles: ["admins"],
  })
  assignedRoles: string[] = []
}

/**
 * FeatureGalleryController — 展示 iAction 的各種進階用法與 RBAC 限制。
 * 定義於 FeatureGallery 之後，以便使用 @iController(FeatureGallery)。
 */
@iController(FeatureGallery)
export class FeatureGalleryController {
  /**
   * 基礎數值增加（管理員與經理可執行）。
   */
  @iAction({
    caption: "增加數值",
    icon: "PlusCircle",
    allowedRoles: ["admins", "managers"],
  })
  static async incrementCount(id: string): Promise<void> {
    const repo = remult.repo(FeatureGallery)
    const item = await repo.findId(id)
    if (!item) throw new Error("找不到對象")
    item.counter += 1
    await repo.save(item)
  }

  /**
   * 切換記錄鎖定狀態（僅限管理員）。
   */
  @iAction({
    caption: "切換鎖定狀態",
    icon: "Lock",
    allowedRoles: ["admins"],
  })
  static async toggleLock(id: string): Promise<void> {
    const repo = remult.repo(FeatureGallery)
    const item = await repo.findId(id)
    if (!item) throw new Error("找不到對象")
    item.isLocked = !item.isLocked
    await repo.save(item)
  }

  /**
   * 管理員重設秘密資訊。
   */
  @iAction({
    caption: "重設秘密",
    icon: "Key",
    allowedRoles: ["admins"],
  })
  static async resetSecret(id: string): Promise<void> {
    const repo = remult.repo(FeatureGallery)
    const item = await repo.findId(id)
    if (!item) throw new Error("找不到對象")
    item.secretInfo = "NEW-SECRET-" + Math.random().toString(36).slice(2, 7).toUpperCase()
    await repo.save(item)
  }
}
