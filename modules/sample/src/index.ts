// modules/sample/src/index.ts
import { defineModule } from "@iraf/core"
import { FeatureGallery, FeatureGalleryController } from "./entities/FeatureGallery"
import { MasterItem } from "./entities/MasterItem"
import { DetailItem } from "./entities/DetailItem"

/**
 * SampleModule — iRAF 全功能示範模組。
 *
 * 此模組包含：
 * - FeatureGallery：全功能元數據配置、RBAC 權限與 iAction 演示
 * - MasterItem / DetailItem：Master-Detail SubGrid 示範
 *
 * 選單只顯示 FeatureGallery 和 MasterItem；
 * DetailItem 僅透過 MasterItem 的 SubGrid 存取。
 */
export const SampleModule = defineModule({
  key: "sample",
  caption: "範例展示",
  icon: "FlaskConical",
  description: "提供完整元數據配置、RBAC 權限與 iAction 的演示，以及 Master-Detail SubGrid 示範。",
  entities: [FeatureGallery, MasterItem, DetailItem],
  controllers: [FeatureGalleryController],
  menu: [
    { entity: FeatureGallery, caption: "功能展示", icon: "Component", order: 1 },
    { entity: MasterItem,     caption: "主項目",   icon: "ListOrdered", order: 2 },
  ],
})
