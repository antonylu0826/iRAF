import { iAction } from "@iraf/core"
import { remult } from "remult"
import { Sample } from "../entities/Sample"

/**
 * SampleController — 用於測試 iAction 的後端邏輯。
 */
export class SampleController {
  @iAction({
    caption: "增加數值",
    icon: "PlusCircle",
    allowedRoles: ["admin", "sales"],
  })
  static async incrementCount(id: string): Promise<void> {
    const repo = remult.repo(Sample)
    const sample = await repo.findId(id)
    if (!sample) throw new Error("找不到該測試物件")

    sample.count += 1
    await repo.save(sample)
  }

  @iAction({
    caption: "切換啟用狀態",
    icon: "Power",
    allowedRoles: ["admin"],
  })
  static async toggleActive(id: string): Promise<void> {
    const repo = remult.repo(Sample)
    const sample = await repo.findId(id)
    if (!sample) throw new Error("找不到該測試物件")

    sample.isActive = !sample.isActive
    await repo.save(sample)
  }
}
