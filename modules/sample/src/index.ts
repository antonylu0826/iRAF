// modules/sample/src/index.ts
import { defineModule } from "@iraf/core"
import { FeatureGallery, FeatureGalleryController } from "./entities/FeatureGallery"

/**
 * SampleModule — iRAF 全功能示範模組。
 * 
 * 此模組包含 FeatureGallery 實體，作為 AI Agent 與開發者的參考範本。
 */
export const SampleModule = defineModule({
  key: "sample",
  caption: "範例展示",
  icon: "FlaskConical",
  description: "提供完整元數據配置、RBAC 權限與 iAction 的演示。",
  entities: [FeatureGallery],
  controllers: [FeatureGalleryController],
})
