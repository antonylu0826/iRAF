// modules/sample/src/entities/FeatureGallery.ts
import { iEntity, iField, iController, BaseObject, passwordRules, iAction } from "@iraf/core"
import { remult } from "remult"

/**
 * FeatureGallery — full-feature demo entity for iRAF.
 */
@iEntity("feature-gallery", {
  caption: "Feature Gallery",
  icon: "Component",
  allowedRoles: {
    read:   ["admins", "managers", "users"],
    create: ["admins", "managers"],
    update: ["admins", "managers"],
    delete: ["admins"],
  },
})
export class FeatureGallery extends BaseObject {
  // --- Base group: General Info ---

  @iField.string({
    caption: "Title (admins only)",
    required: true,
    group: "General Info",
    order: 1,
    writeRoles: ["admins"],
    placeholder: "Read-only for non-admins"
  })
  title = ""

  @iField.string({
    caption: "Description (textarea)",
    group: "General Info",
    order: 2,
    control: "textarea",
  })
  description = ""

  @iField.string({
    caption: "Category",
    group: "General Info",
    order: 3,
    placeholder: "Custom category"
  })
  category = "Default"

  // --- Advanced group: Numbers & Dates ---

  @iField.number({
    caption: "Counter",
    group: "Advanced",
    order: 10,
    validate: (v) => (v < 0 ? "Counter cannot be less than 0." : undefined)
  })
  counter = 0

  @iField.date({
    caption: "Effective Date",
    group: "Advanced",
    order: 11,
  })
  effectiveDate = new Date()

  @iField.boolean({
    caption: "Locked (affects fields below)",
    group: "Advanced",
    order: 12,
  })
  isLocked = false

  // --- Dynamic UI rules ---

  @iField.string({
    caption: "Read-only when locked",
    group: "Dynamic Rules",
    order: 20,
    readOnly: (e: FeatureGallery) => e.isLocked,
    placeholder: "Becomes read-only when locked"
  })
  lockControlledText = ""

  @iField.string({
    caption: "Hidden when locked",
    group: "Dynamic Rules",
    order: 21,
    hidden: (e: FeatureGallery) => e.isLocked,
    placeholder: "Hidden when locked"
  })
  secretInfo = ""

  // --- Security & System ---

  @iField.string({
    caption: "Password (passwordRules)",
    group: "Security & System",
    order: 30,
    control: "password",
    validate: passwordRules({ minLength: 8, requireUppercase: true, requireNumber: true }),
  })
  demoPassword = ""

  @iField.json({
    caption: "Assigned Roles (roles control)",
    group: "Security & System",
    order: 31,
    control: "roles",
    writeRoles: ["admins"],
  })
  assignedRoles: string[] = []

  @iField.string({
    caption: "Priority (Enum/Options)",
    group: "Security & System",
    order: 32,
    options: ["Low", "Medium", "High"],
    placeholder: "Demonstrate select metadata"
  })
  priority = "Medium"

  @iField.string({
    caption: "Assignee (Reference/Lookup)",
    group: "Security & System",
    order: 33,
    ref: "users",
    refLabel: "displayName",
    placeholder: "Demonstrate reference lookup to users"
  })
  assigneeId = ""
}

/**
 * FeatureGalleryController — advanced iAction demos with RBAC constraints.
 * Declared after FeatureGallery so we can use @iController(FeatureGallery).
 */
@iController(FeatureGallery)
export class FeatureGalleryController {
  /**
   * Increment counter (admins and managers).
   */
  @iAction({
    caption: "Increment Counter",
    icon: "PlusCircle",
    allowedRoles: ["admins", "managers"],
  })
  static async incrementCount(id: string): Promise<void> {
    const repo = remult.repo(FeatureGallery)
    const item = await repo.findId(id)
    if (!item) throw new Error("Record not found.")
    item.counter += 1
    await repo.save(item)
  }

  /**
   * Toggle lock state (admins only).
   */
  @iAction({
    caption: "Toggle Lock",
    icon: "Lock",
    allowedRoles: ["admins"],
  })
  static async toggleLock(id: string): Promise<void> {
    const repo = remult.repo(FeatureGallery)
    const item = await repo.findId(id)
    if (!item) throw new Error("Record not found.")
    item.isLocked = !item.isLocked
    await repo.save(item)
  }

  /**
   * Reset secret (admins only).
   */
  @iAction({
    caption: "Reset Secret",
    icon: "Key",
    allowedRoles: ["admins"],
  })
  static async resetSecret(id: string): Promise<void> {
    const repo = remult.repo(FeatureGallery)
    const item = await repo.findId(id)
    if (!item) throw new Error("Record not found.")
    item.secretInfo = "NEW-SECRET-" + Math.random().toString(36).slice(2, 7).toUpperCase()
    await repo.save(item)
  }
}
